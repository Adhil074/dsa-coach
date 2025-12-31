import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Progress } from "@/lib/models/progress";
import { User } from "@/lib/models/user";
import { getToken } from "next-auth/jwt";

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

export async function GET(request: NextRequest) {
  try {
    // Auth: Get user from token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Return empty data if not authenticated
    if (!token || typeof token.email !== "string") {
      const emptyResponse: SummaryResponse = {
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
      return NextResponse.json(emptyResponse);
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: token.email }).lean();
    if (!user) {
      const emptyResponse: SummaryResponse = {
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
      return NextResponse.json(emptyResponse);
    }

    // Query ONLY this user's progress
    const all = await Progress.find({ userId: user._id });

    let totalSolved = 0;
    let totalAttempts = 0;
    let failedAttempts = 0;

    const topicStats: Record<string, TopicStats> = {};
    const difficultyStats: Record<"easy" | "medium" | "hard", DifficultyStats> = {
      easy: { solved: 0, attempts: 0, failed: 0 },
      medium: { solved: 0, attempts: 0, failed: 0 },
      hard: { solved: 0, attempts: 0, failed: 0 },
    };

    for (const p of all) {
      const topic: string = p.topic || "unknown";
      const diff: "easy" | "medium" | "hard" =
        (p.difficulty as "easy" | "medium" | "hard") || "easy";

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

    const response: SummaryResponse = {
      totalSolved,
      totalAttempts,
      failedAttempts,
      topicStats,
      difficultyStats,
    };

    const res = NextResponse.json(response);
    
    // Disable caching to ensure fresh data
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");

    return res;
  } catch (err) {
    console.error("Progress summary error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}