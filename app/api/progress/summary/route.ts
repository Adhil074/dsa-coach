// app/api/progress/summary/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Progress } from "@/lib/models/progress";
import { User } from "@/lib/models/user";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

/* ---------------- Types ---------------- */

interface AuthToken {
  email?: string;
}

interface UserDoc {
  _id: Types.ObjectId;
  email: string;
}

interface ProgressDoc {
  userId: Types.ObjectId;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  status?: "solved" | "attempted";
  submissionCount?: number;
  failedAttempts?: number;
}

interface TopicStats {
  solved: number;
  attempts: number;
  failed: number;
}

interface DifficultyStats {
  solved: number;
  attempts: number;
  failed: number;
}

interface SummaryResponse {
  totalSolved: number;
  totalAttempts: number;
  failedAttempts: number;
  topicStats: Record<string, TopicStats>;
  difficultyStats: Record<"easy" | "medium" | "hard", DifficultyStats>;
}

/* ---------------- Route ---------------- */

export async function GET(request: NextRequest) {
  try {
    /* 1. Auth */
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as AuthToken | null;

    if (!token || typeof token.email !== "string") {
      return NextResponse.json(emptySummary());
    }

    /* 2. DB */
    await connectToDatabase();

    /* 3. User */
    const user = (await User.findOne({
      email: token.email,
    }).lean()) as UserDoc | null;

    if (!user) {
      return NextResponse.json(emptySummary());
    }

    /* 4. Fetch progress (LEAN is IMPORTANT) */
    const progresses = (await Progress.find({
      userId: user._id,
    }).lean()) as ProgressDoc[];

    /* 5. Aggregate */
    let totalSolved = 0;
    let totalAttempts = 0;
    let failedAttempts = 0;

    const topicStats: Record<string, TopicStats> = {};
    const difficultyStats: SummaryResponse["difficultyStats"] = {
      easy: { solved: 0, attempts: 0, failed: 0 },
      medium: { solved: 0, attempts: 0, failed: 0 },
      hard: { solved: 0, attempts: 0, failed: 0 },
    };

    for (const p of progresses) {
      const topic = p.topic ?? "unknown";
      const diff = p.difficulty ?? "easy";

      if (!topicStats[topic]) {
        topicStats[topic] = { solved: 0, attempts: 0, failed: 0 };
      }

      const attempts = p.submissionCount ?? 0;
      const fails = p.failedAttempts ?? 0;

      totalAttempts += attempts;
      failedAttempts += fails;

      topicStats[topic].attempts += attempts;
      topicStats[topic].failed += fails;

      difficultyStats[diff].attempts += attempts;
      difficultyStats[diff].failed += fails;

      if (p.status === "solved") {
        totalSolved += 1;
        topicStats[topic].solved += 1;
        difficultyStats[diff].solved += 1;
      }
    }

    const res = NextResponse.json({
      totalSolved,
      totalAttempts,
      failedAttempts,
      topicStats,
      difficultyStats,
    } satisfies SummaryResponse);

    /* 6. No cache */
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("Progress summary error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------------- Helpers ---------------- */

function emptySummary(): SummaryResponse {
  return {
    totalSolved: 0,
    totalAttempts: 0,
    failedAttempts: 0,
    topicStats: {},
    difficultyStats: {
      easy: { solved: 0, attempts: 0, failed: 0 },
      medium: { solved: 0, attempts: 0, failed: 0 },
      hard: { solved: 0, attempts: 0, failed: 0 },
    },
  };
}