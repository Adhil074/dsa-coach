
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase, getCollections } from "../../../../../lib/db"; 
import { User } from "../../../../../lib/models/user";
import { Progress } from "../../../../../lib/models/progress";

export async function GET(request: Request) {
  try {
    // 1) auth: getToken from request (uses NEXTAUTH secret)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !(token as any).email) {
      return NextResponse.json([], { status: 200 }); // return empty array for unauthenticated
    }
    const email = String((token as any).email);

    // 2) connect DB
    await connectToDatabase();

    // 3) find user doc by email
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    // 4) query progresses collection for this user where status is 'solved'
    const solvedProgresses = await Progress.find({
      userId: user._id,
      status: "solved",
    })
      .sort({ solvedAt: -1, updatedAt: -1 })
      .lean();

    // 5) map to minimal shape the client expects
    const results = solvedProgresses.map((p) => ({
      problemId: String((p as any).problemId?._id ?? (p as any).problemId ?? ""),
      title: (p as any).title ?? null,
      topic: (p as any).topic ?? null,
      difficulty: (p as any).difficulty ?? null,
      solvedAt: (p as any).solvedAt ?? (p as any).updatedAt ?? null,
      lastCodeSnippet:
        typeof (p as any).lastCode === "string"
          ? ((p as any).lastCode as string).slice(0, 800)
          : null,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/progress/solved error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import { connectToDatabase } from "../../../../../lib/db";
// import { User } from "../../../../../lib/models/user";
// import { Progress } from "../../../../../lib/models/progress";
// import { Types } from "mongoose";

// ///types

// type AuthToken = {
//   email?: string | null;
// };

// type LeanProgress = {
//   problemId?: Types.ObjectId | { _id?: Types.ObjectId } | string;
//   title?: string;
//   topic?: string;
//   difficulty?: string;
//   solvedAt?: Date;
//   updatedAt?: Date;
//   lastCode?: string;
// };

// //route

// export async function GET(request: Request) {
//   try {
//     // 1) Auth
//     const token = (await getToken({
//       req: request,
//       secret: process.env.NEXTAUTH_SECRET,
//     })) as AuthToken | null;

//     if (!token?.email) {
//       return NextResponse.json([], { status: 200 });
//     }

//     const email = token.email;

//     // 2) DB connect
//     await connectToDatabase();

//     // 3) find User by mail
//     const user = await User.findOne({ email }).lean<{ _id: Types.ObjectId }>();
//     if (!user) {
//       return NextResponse.json([], { status: 200 });
//     }

//     // 4) Progress
//     const solvedProgresses = await Progress.find({
//       userId: user._id,
//       status: "solved",
//     })
//       .sort({ solvedAt: -1, updatedAt: -1 })
//       .lean<LeanProgress[]>();

//     // 5) response mapping
//     const results = solvedProgresses.map((p) => {
//       const problemId =
//         typeof p.problemId === "string"
//           ? p.problemId
//           : p.problemId instanceof Types.ObjectId
//           ? p.problemId.toString()
//           : p.problemId?._id instanceof Types.ObjectId
//           ? p.problemId._id.toString()
//           : "";

//       return {
//         problemId,
//         title: p.title ?? null,
//         topic: p.topic ?? null,
//         difficulty: p.difficulty ?? null,
//         solvedAt: p.solvedAt ?? p.updatedAt ?? null,
//         lastCodeSnippet:
//           typeof p.lastCode === "string"
//             ? p.lastCode.slice(0, 800)
//             : null,
//       };
//     });

//     return NextResponse.json(results);
//   } catch (err) {
//     console.error("GET /api/progress/solved error:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }