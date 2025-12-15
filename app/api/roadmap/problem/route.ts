// import { NextResponse } from "next/server";
// import { connectToDatabase } from "../../../../../lib/db";
// import { Problem } from "../../../../../lib/models/problem";
// import { Types } from "mongoose";

// export async function GET(req: Request) {
//   try {
//     await connectToDatabase();

//     const { searchParams } = new URL(req.url);
//     const problemId = searchParams.get("problemId");

//     if (!problemId) {
//       return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
//     }

//     if (!Types.ObjectId.isValid(problemId)) {
//       return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
//     }

//     const problem = await Problem.findById(problemId).lean();

//     if (!problem) {
//       return NextResponse.json({ error: "Problem not found" }, { status: 404 });
//     }

//     return NextResponse.json(problem);
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Problem } from "../../../../../lib/models/problem";
import { Types } from "mongoose";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");

    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(problemId)) {
      return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
    }

    const problem = await Problem.findById(problemId).lean();

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // 🔥 NORMALIZE RESPONSE (CRITICAL)
    return NextResponse.json({
      id: problem._id.toString(),
      title: problem.title,
      description: problem.description,
      topic: problem.topic,
      difficulty: problem.difficulty,
      optimalTime: problem.optimalTime ?? null,
      optimalSpace: problem.optimalSpace ?? null,
      examples: problem.examples ?? [],
      testCases: problem.testCases ?? [],
      constraints: problem.constraints ?? "",
      supportedLanguages: problem.supportedLanguages ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
