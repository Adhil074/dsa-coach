// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { connectToDatabase } from "../../../../../lib/db";
// import { Submission } from "../../../../../lib/models/submission";
// import { Problem } from "../../../../../lib/models/problem";
// import { getToken } from "next-auth/jwt";
// import { Types } from "mongoose";

// export async function GET(request: Request) {
//   try {
//     const token = await getToken({
//       req: request,
//       secret: process.env.NEXTAUTH_SECRET,
//     });

//     if (!token || typeof token.sub !== "string") {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await connectToDatabase();

//     const data = await Submission.aggregate([
//       {
//         $match: {
//           userId: new Types.ObjectId(token.sub),
//         },
//       },
//       {
//         $group: {
//           _id: "$problemId",
//           topic: { $first: "$topic" },
//           incorrectCount: {
//             $sum: { $cond: [{ $eq: ["$verdict", "incorrect"] }, 1, 0] },
//           },
//           suboptimalCount: {
//             $sum: { $cond: [{ $eq: ["$verdict", "suboptimal"] }, 1, 0] },
//           },
//         },
//       },
//       {
//         $match: {
//           $or: [
//             { incorrectCount: { $gt: 3 } },
//             { suboptimalCount: { $gt: 5 } },
//           ],
//         },
//       },
//       {
//         $lookup: {
//           from: "problems",
//           localField: "_id",
//           foreignField: "_id",
//           as: "problem",
//         },
//       },
//       { $unwind: "$problem" },
//       {
//         $project: {
//           _id: 0,
//           problemId: "$_id",
//           title: "$problem.title",
//           topic: 1,
//           difficulty: "$problem.difficulty",
//           incorrectCount: 1,
//           suboptimalCount: 1,
//         },
//       },
//     ]);

//     return NextResponse.json({
//       success: true,
//       struggledProblems: data,
//     });
//   } catch (err) {
//     console.error("Struggled problems error:", err);
//     return NextResponse.json(
//       { error: "Server error" },
//       { status: 500 }
//     );
//   }
// }

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Submission } from "../../../../../lib/models/submission";
import { Problem } from "../../../../../lib/models/problem";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || typeof token.sub !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // 1️⃣ Get all problems that crossed struggle threshold
    const candidates = await Submission.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(token.sub),
        },
      },
      {
        $group: {
          _id: "$problemId",
          topic: { $first: "$topic" },
          incorrectCount: {
            $sum: { $cond: [{ $eq: ["$verdict", "incorrect"] }, 1, 0] },
          },
          suboptimalCount: {
            $sum: { $cond: [{ $eq: ["$verdict", "suboptimal"] }, 1, 0] },
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
    ]);

    const struggledProblems = [];

    // 2️⃣ For each candidate, check LAST 2 submissions
    for (const c of candidates) {
      const lastTwo = await Submission.find({
        userId: token.sub,
        problemId: c._id,
      })
        .sort({ createdAt: -1 })
        .limit(2)
        .lean();

      // If last 2 are correct → AUTO HIDE
      if (
        lastTwo.length === 2 &&
        lastTwo.every((s) => s.verdict === "correct")
      ) {
        continue;
      }

      const problem = await Problem.findById(c._id).lean();
      if (!problem) continue;

      struggledProblems.push({
        problemId: c._id,
        title: problem.title,
        topic: c.topic,
        difficulty: problem.difficulty,
        incorrectCount: c.incorrectCount,
        suboptimalCount: c.suboptimalCount,
      });
    }

    return NextResponse.json({
      success: true,
      struggledProblems,
    });
  } catch (err) {
    console.error("Struggled problems error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
