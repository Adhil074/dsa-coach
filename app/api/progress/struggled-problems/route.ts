// app/api/progress/struggled-problems/route.ts

export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Submission } from "@/lib/models/submission";
import { Problem } from "@/lib/models/problem";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

type AuthToken = {
  sub?: string;
};

type AggregatedCandidate = {
  _id: Types.ObjectId;
  topic: string;
  incorrectCount: number;
  suboptimalCount: number;
};

type SubmissionDoc = {
  verdict: "correct_optimal" | "correct_suboptimal" | "incorrect";
};

export async function GET(request: NextRequest) {
  try {
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as AuthToken | null;

    if (!token || !token.sub) {
      return NextResponse.json({ struggledProblems: [] });
    }

    const userId = new Types.ObjectId(token.sub);

    await connectToDatabase();

    const candidates = (await Submission.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $group: {
          _id: "$problemId",
          topic: { $first: "$topic" },
          incorrectCount: {
            $sum: {
              $cond: [{ $eq: ["$verdict", "incorrect"] }, 1, 0],
            },
          },
          suboptimalCount: {
            $sum: {
              $cond: [{ $eq: ["$verdict", "correct_suboptimal"] }, 1, 0],
            },
          },
        },
      },
      {
        $match: {
          $or: [
            { incorrectCount: { $gte: 3 } },
            { suboptimalCount: { $gte: 5 } },
          ],
        },
      },
    ])) as AggregatedCandidate[];

    const struggledProblems = [];

    for (const c of candidates) {
      const lastTwo = (await Submission.find({
        userId,
        problemId: c._id,
      })
        .sort({ createdAt: -1 })
        .limit(2)
        .lean()) as SubmissionDoc[];

      // If last 2 submissions are correct → hide
      if (
        lastTwo.length === 2 &&
        lastTwo.every(
          (s) => s.verdict === "correct_optimal"
        )
      ) {
        continue;
      }

      const problem = await Problem.findById(c._id).lean();
      if (!problem) continue;

      struggledProblems.push({
        problemId: String(c._id),
        title: problem.title,
        topic: c.topic,
        difficulty: problem.difficulty,
        incorrectCount: c.incorrectCount,
        suboptimalCount: c.suboptimalCount,
      });
    }

    const response = NextResponse.json({
      success: true,
      struggledProblems,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (err) {
    console.error("Struggled problems error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}