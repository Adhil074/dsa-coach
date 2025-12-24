//app\api\progress\solved\route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase, getCollections } from "../../../../../lib/db"; // adjust path if different
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