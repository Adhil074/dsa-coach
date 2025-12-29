export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "../../../../lib/db";
import { Problem } from "../../../../lib/models/problem";
import { Progress } from "../../../../lib/models/progress";
import { User } from "../../../../lib/models/user";
import { Types } from "mongoose";

type Difficulty = "easy" | "medium" | "hard";

type RoadmapItem = {
  problemId: string;
  title: string;
  slug: string;
  topic: string;
  difficulty: Difficulty | null;
  solved: boolean;
};

const TOPICS: string[] = ["arrays", "strings", "linked-list", "dp", "graphs"];

async function fetchProblem(
  topic: string,
  difficulty: Difficulty,
  solvedSet: Set<string>
): Promise<RoadmapItem | null> {
  const p = await Problem.findOne({ topic, difficulty }).lean();
  if (!p) return null;

  const id = String((p._id as Types.ObjectId).toString());

  return {
    problemId: id,
    title: String(p.title ?? "Untitled problem"),
    slug: String(p.slug ?? ""),
    topic: String(p.topic ?? topic),
    difficulty: p.difficulty as Difficulty,
    solved: solvedSet.has(id),
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // auth
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    let solvedSet = new Set<string>();

    if (token && typeof token.email === "string") {
      const user = await User.findOne({ email: token.email }).lean();

      if (user) {
        const solved = await Progress.find({
          userId: user._id,
          status: "solved",
        })
          .select({ problemId: 1 })
          .lean();

        solvedSet = new Set(
          solved.map((p) => String(p.problemId))
        );
      }
    }

    // build roadmap
    const roadmap: RoadmapItem[] = [];

    for (const topic of TOPICS) {
      const easy = await fetchProblem(topic, "easy", solvedSet);
      const medium = await fetchProblem(topic, "medium", solvedSet);
      const hard = await fetchProblem(topic, "hard", solvedSet);

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