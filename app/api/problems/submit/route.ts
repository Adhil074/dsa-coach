export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Problem } from "../../../../../lib/models/problem";
import { Progress } from "../../../../../lib/models/progress";
import { User } from "../../../../../lib/models/user";
import { Submission } from "../../../../../lib/models/submission";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

// Local interfaces inferred from code usage (minimal, based on accessed fields – adjust if schemas differ)
interface UserToken {
  email?: string;
}

interface IProblem {
  _id: Types.ObjectId;
  topic?: string;
  title?: string;
  difficulty?: string;
}

interface IUser {
  _id: Types.ObjectId;
  email: string;
}

interface IProgress {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  language?: string;
  lastCode?: string;
  topic?: string;
  title?: string;
  difficulty?: string;
  status?: "solved" | "attempted";
  updatedAt?: Date;
  solvedAt?: Date;
  submissionCount?: number;
  failedAttempts?: number;
  solvedCount?: number;
}

interface ISubmission {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  code: string;
  language: string;
  solved: boolean;
  topic: string;
  difficulty: string;
  verdict: "correct_optimal" | "correct_suboptimal" | "incorrect";
  createdAt: Date;
}

interface SubmitBody {
  problemId: string;
  code: string;
  language: string;
  verdict?: "correct_optimal" | "correct_suboptimal" | "incorrect";
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate using NextAuth token (typed safely)
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as UserToken | null;

    if (!token || typeof token.email !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = token.email;

    // Parse body
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<SubmitBody>;
    const problemId = String(body.problemId ?? "");
    const code = String(body.code ?? "");
    const language = String(body.language ?? "javascript");
    const verdict = body.verdict;

    if (!problemId) {
      return NextResponse.json(
        { error: "problemId is required" },
        { status: 400 }
      );
    }
    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    if (!verdict) {
      return NextResponse.json(
        { error: "verdict is required" },
        { status: 400 }
      );
    }

    // Connect DB
    await connectToDatabase();

    // Resolve problem by id or slug (typed)
    let problemDoc: IProblem | null = null;

    if (Types.ObjectId.isValid(problemId)) {
      try {
        problemDoc = (await Problem.findById(
          problemId
        ).lean()) as IProblem | null;
      } catch {
        problemDoc = null;
      }
    }
    if (!problemDoc) {
      problemDoc = (await Problem.findOne({
        slug: String(problemId).toLowerCase().trim(),
      }).lean()) as IProblem | null;
    }

    if (!problemDoc) {
      return NextResponse.json(
        { error: `Problem not found: ${problemId}` },
        { status: 404 }
      );
    }

    // Find user (typed)
    const user = (await User.findOne({
      email: userEmail,
    }).lean()) as IUser | null;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine solved state from verdict
    const solvedNow = verdict !== "incorrect";

    // Save submission (typed object)
    try {
      await Submission.create({
        userId: new Types.ObjectId(String(user._id)),
        problemId: new Types.ObjectId(String(problemDoc._id)),
        code,
        language,
        solved: solvedNow,
        topic: String(problemDoc.topic ?? ""),
        difficulty: String(problemDoc.difficulty ?? ""),
        verdict,
        createdAt: new Date(),
      } as ISubmission);
    } catch (err) {
      console.error("Submission save error:", err);
      // Non-fatal — do NOT block user
    }

    // Update progress document (typed FilterQuery and UpdateQuery)
    try {
      const progressFilter = {
        userId: new Types.ObjectId(String(user._id)),
        problemId: new Types.ObjectId(String(problemDoc._id)),
      };

      const existing = (await Progress.findOne(
        progressFilter
      ).lean()) as IProgress | null;

      // Build updates safely: Partial for $set, Record for $inc (no dynamic keys/casts)
      const setObj: Partial<IProgress> = {
        language,
        lastCode: code,
        topic: String(problemDoc.topic ?? ""),
        title: String(problemDoc.title ?? ""),
        difficulty: String(problemDoc.difficulty ?? ""),
        status: solvedNow ? "solved" : "attempted",
        updatedAt: new Date(),
      };

      const incObj: Record<string, number> = {
        submissionCount: 1,
      };
      if (!solvedNow) {
        incObj.failedAttempts = 1;
      }

      if (solvedNow) {
        setObj.solvedAt = new Date(); // Direct assign
        if (!existing || existing.status !== "solved") {
          incObj.solvedCount = (existing?.solvedCount ?? 0) + 1;
        }
        // If already solved, just update timestamp (no inc) – logic preserved
      }

      const updateObj = {
        $set: setObj,
        $inc: incObj,
      };

      await Progress.findOneAndUpdate(progressFilter, updateObj, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      console.error("Progress save error:", err);
      // Non-fatal
    }

    // Return success with verdict info
    return NextResponse.json({
      success: true,
      message: "Submission evaluated and saved",
      solved: solvedNow,
      verdict: verdict,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Submit error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
