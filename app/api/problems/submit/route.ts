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
  solved?: boolean;
}

interface UpdateOperation {
  $set: Record<string, unknown>;
  $inc: Record<string, number>;
}

export async function POST(request: Request) {
  try {
    // --- Authenticate reliably using getToken ---
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // token.email should exist (from credentials provider)
    const userEmail = String((token as any).email ?? "");

    // connect DB
    await connectToDatabase();

    // Parse body
    const body: SubmitBody = await request.json().catch(() => ({
      problemId: "",
      code: "",
      language: "javascript",
    }));

    const { problemId, code, language = "javascript", solved = false } = body;

    // Validation
    if (!problemId) {
      return NextResponse.json(
        { error: "problemId is required" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    // Find problem by ID or slug
    let problem: any = null;

    // Try ObjectId first
    if (Types.ObjectId.isValid(problemId)) {
      try {
        problem = await Problem.findById(problemId).lean();
      } catch {
        problem = null;
      }
    }

    // If not found, try slug
    if (!problem) {
      problem = await Problem.findOne({
        slug: String(problemId).toLowerCase().trim(),
      }).lean();
    }

    if (!problem) {
      return NextResponse.json(
        { error: `Problem not found: ${problemId}` },
        { status: 404 }
      );
    }

    // Find user by email (from token)
    const user = await User.findOne({ email: userEmail }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save/update progress in `progresses` collection (single source-of-truth)
    try {
      const progressFilter = {
        userId: new Types.ObjectId(String(user._id)),
        problemId: new Types.ObjectId(String(problem._id)),
      };

      // Load existing progress to avoid double increment of solvedCount
      const existing = await Progress.findOne(progressFilter).lean();

      const updateObj: UpdateOperation = {
        $set: {
          language,
          lastCode: code,
          topic: problem.topic,
          title: problem.title,
          difficulty: problem.difficulty,
          status: solved ? "solved" : "attempted",
          updatedAt: new Date(),
        },
        $inc: {
          submissionCount: 1,
        },
      };

      // If marking solved and wasn't solved before, set solvedAt and increment solvedCount
      if (solved) {
        if (!existing || existing.status !== "solved") {
          (updateObj.$set as any)["solvedAt"] = new Date();
          updateObj.$inc["solvedCount"] = 1;
        } else {
          // If already solved, still update solvedAt to now (optional)
          (updateObj.$set as any)["solvedAt"] = new Date();
        }
      }

      await Progress.findOneAndUpdate(progressFilter, updateObj, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      console.error("Progress save error:", err);
      // Non-fatal, continue
    }

    return NextResponse.json({
      success: true,
      message: "Submission saved",
      passed: 0,
      total: 0,
      solved,
      results: [],
      analysis: "Submission saved successfully",
    });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}