import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Progress } from "../../../../../lib/models/progress";

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

export async function GET() {
  try {
    await connectToDatabase();

    const all = await Progress.find({});

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

    return NextResponse.json(response);
  } catch (err) {
    console.error("Progress summary error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}