export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Problem } from "../../../../../lib/models/problem";
import { Progress } from "../../../../../lib/models/progress";
import { User } from "../../../../../lib/models/user";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

interface SubmitBody {
  problemId: string;
  code: string;
  language: string;
  solved?: boolean; // optional client hint (we'll override using runner)
}

interface UpdateOperation {
  $set: Record<string, unknown>;
  $inc: Record<string, number>;
}

type RunnerResult = {
  success: boolean;
  passedCount: number;
  total: number;
  results?: Array<Record<string, unknown>>;
  error?: string;
};

export async function POST(request: Request) {
  try {
    // --- Authenticate using next-auth token ---
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as Record<string, unknown> | null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = typeof token.email === "string" ? token.email : "";
    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized (no email)" },
        { status: 401 }
      );
    }

    // Parse body
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<SubmitBody>;
    const problemId = String(body.problemId ?? "");
    const code = String(body.code ?? "");
    const language = String(body.language ?? "javascript");

    if (!problemId) {
      return NextResponse.json(
        { error: "problemId is required" },
        { status: 400 }
      );
    }
    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    // Connect DB
    await connectToDatabase();

    // Resolve problem by id or slug
    let problemDoc = null as
      | (Record<string, unknown> & { _id?: unknown })
      | null;

    if (Types.ObjectId.isValid(problemId)) {
      try {
        problemDoc = (await Problem.findById(problemId).lean()) as Record<
          string,
          unknown
        > | null;
      } catch {
        problemDoc = null;
      }
    }
    if (!problemDoc) {
      problemDoc = (await Problem.findOne({
        slug: String(problemId).toLowerCase().trim(),
      }).lean()) as Record<string, unknown> | null;
    }

    if (!problemDoc) {
      return NextResponse.json(
        { error: `Problem not found: ${problemId}` },
        { status: 404 }
      );
    }

    // Find user
    const user = (await User.findOne({ email: userEmail }).lean()) as Record<
      string,
      unknown
    > | null;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Call run endpoint to evaluate code against problem's test cases
    // Use an absolute URL fallback to localhost if NEXT_PUBLIC_BASE_URL not set
    const base =
      typeof process.env.NEXT_PUBLIC_BASE_URL === "string" &&
      process.env.NEXT_PUBLIC_BASE_URL.length > 0
        ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "")
        : typeof process.env.NEXTAUTH_URL === "string" &&
          process.env.NEXTAUTH_URL.length > 0
        ? process.env.NEXTAUTH_URL.replace(/\/+$/, "")
        : "http://localhost:3000";

    const runUrl = `${base}/api/problems/run`;

    let runnerResult: RunnerResult = {
      success: false,
      passedCount: 0,
      total: 0,
    };

    try {
      const runResp = await fetch(runUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          code,
          language,
        }),
      });

      if (!runResp.ok) {
        // attempt to parse error
        const text = await runResp.text().catch(() => "Runner fetch failed");
        runnerResult = {
          success: false,
          passedCount: 0,
          total: 0,
          error: text,
        };
      } else {
        const json = (await runResp.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        runnerResult = {
          success: Boolean(json.success),
          passedCount: Number(json.passedCount ?? 0),
          total: Number(json.total ?? 0),
          results: Array.isArray(json.results)
            ? (json.results as Array<Record<string, unknown>>)
            : undefined,
          error: typeof json.error === "string" ? json.error : undefined,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Runner call failed:", message);
      runnerResult = {
        success: false,
        passedCount: 0,
        total: 0,
        error: message,
      };
    }

    // Determine solved state from runner
    const solvedNow =
      runnerResult.success &&
      runnerResult.total > 0 &&
      runnerResult.passedCount === runnerResult.total;

    // Update progress document
    try {
      const progressFilter = {
        userId: new Types.ObjectId(String(user._id)),
        problemId: new Types.ObjectId(String(problemDoc._id)),
      };

      const existing = await Progress.findOne(progressFilter).lean();

      const updateObj: UpdateOperation = {
        $set: {
          language,
          lastCode: code,
          topic: String(problemDoc.topic ?? ""),
          title: String(problemDoc.title ?? ""),
          difficulty: String(problemDoc.difficulty ?? ""),
          status: solvedNow ? "solved" : "attempted",
          updatedAt: new Date(),
        },
        $inc: {
          submissionCount: 1,
          ...(solvedNow ? {} : { failedAttempts: 1 }),
        },
      };

      if (solvedNow) {
        if (
          !existing ||
          (existing as Record<string, unknown>).status !== "solved"
        ) {
          updateObj.$set["solvedAt"] = new Date();
          updateObj.$inc["solvedCount"] =
            (updateObj.$inc["solvedCount"] ?? 0) + 1;
        } else {
          // already solved previously — update solvedAt timestamp
          updateObj.$set["solvedAt"] = new Date();
        }
      }

      await Progress.findOneAndUpdate(progressFilter, updateObj, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      console.error("Progress save error:", err);
      // Non-fatal
    }

    // Return runner details + progress outcome
    return NextResponse.json({
      success: true,
      message: "Submission evaluated and saved",
      solved: solvedNow,
      runner: runnerResult,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Submit error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
