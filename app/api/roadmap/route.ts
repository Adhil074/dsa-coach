// app/api/roadmap/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import { Problem } from "../../../../lib/models/problem";
import type { LeanDocument } from "mongoose";

type Difficulty = "easy" | "medium" | "hard";

type RoadmapItem = {
  problemId: string;
  title: string;
  slug: string;
  topic: string;
  difficulty: Difficulty | null;
};

const TOPICS = ["arrays", "strings", "linked-list", "dp", "graphs"];

async function fetchProblem(topic: string, difficulty: Difficulty) {
  // find one problem matching topic + difficulty
  // return null if not found
  const p = await Problem.findOne({ topic, difficulty }).lean();
  if (!p) return null;
  return {
    problemId: String((p as LeanDocument<any>)._id),
    title: String(p.title ?? "Untitled problem"),
    slug: String(p.slug ?? ""),
    topic: String(p.topic ?? topic),
    difficulty: (p.difficulty as Difficulty) ?? null,
  } as RoadmapItem;
}

export async function GET() {
  try {
    await connectToDatabase();

    const roadmap: RoadmapItem[] = [];

    // For each topic, try to fetch one easy, one medium, one hard
    for (const topic of TOPICS) {
      const easy = await fetchProblem(topic, "easy");
      const medium = await fetchProblem(topic, "medium");
      const hard = await fetchProblem(topic, "hard");

      // push only found entries (keeps result compact if DB missing some)
      if (easy) roadmap.push(easy);
      if (medium) roadmap.push(medium);
      if (hard) roadmap.push(hard);
    }

    return NextResponse.json({ roadmap }, { status: 200 });
  } catch (err) {
    console.error("Roadmap GET error:", err);
    return NextResponse.json(
      { error: "Failed to load roadmap" },
      { status: 500 }
    );
  }
}
