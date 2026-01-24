// app\api\roadmap\route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import { Problem } from "@/lib/models/problem";
import { Progress } from "@/lib/models/progress";
import { User } from "@/lib/models/user";

type Difficulty = "easy" | "medium" | "hard";

type RoadmapItem = {
  problemId: string;
  title: string;
  slug: string;
  topic: string;
  difficulty: Difficulty;
  solved: boolean;
  phase: number;
  order:number;
};

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

        solvedSet = new Set(solved.map((p) => String(p.problemId)));
      }
    }

    // build roadmap
    // build roadmap strictly by phase
    const roadmap: RoadmapItem[] = [];

    const problems = await Problem.find({})
  .sort({ phase: 1, order: 1 })
  .select({ _id: 1, title: 1, slug: 1, topic: 1, difficulty: 1, phase: 1, order: 1,  })
  .lean();

    for (const p of problems) {
      const id = String(p._id);

      roadmap.push({
        problemId: id,
        title: p.title,
        slug: p.slug,
        topic: p.topic,
        difficulty: p.difficulty,
        solved: solvedSet.has(id),
        phase: p.phase, // 👈 critical
        order:p.order,
      });
    }

    const response = NextResponse.json({ roadmap }, { status: 200 });

    // disable caching to ensure fresh data
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err) {
    console.error("Roadmap GET error:", err);
    return NextResponse.json(
      { error: "Failed to load roadmap" },
      { status: 500 },
    );
  }
}

