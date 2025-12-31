export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Progress } from "@/lib/models/progress";
import { Types } from "mongoose";

// Type for JWT token from NextAuth
interface AuthToken {
  email?: string;
  sub?: string;
  [key: string]: unknown;
}

// Type for User document from database
interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  [key: string]: unknown;
}

// Flexible type for Progress document from database (Mongoose lean returns flexible types)
interface ProgressDoc {
  _id?: Types.ObjectId | number;
  userId?: Types.ObjectId | number;
  problemId?:
    | Types.ObjectId
    | number
    | { _id?: Types.ObjectId | number }
    | null;
  title?: string;
  topic?: string;
  difficulty?: string;
  status?: string;
  lastCode?: string;
  solvedAt?: Date | null;
  updatedAt?: Date | null;
  [key: string]: unknown;
}

// Type for the response sent to client
interface SolvedProblemResponse {
  problemId: string;
  title: string | null;
  topic: string | null;
  difficulty: string | null;
  solvedAt: Date | null;
  lastCodeSnippet: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // 1) auth: getToken from request (uses NEXTAUTH secret)
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as AuthToken | null;

    if (!token || !token.email) {
      return NextResponse.json([], { status: 200 }); // return empty array for unauthenticated
    }
    const email = String(token.email);

    // 2) connect DB
    await connectToDatabase();

    // 3) find user doc by email
    const user = (await User.findOne({ email }).lean()) as UserDoc | null;
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    // 4) query progresses collection for this user where status is 'solved'
    const solvedProgressesRaw = await Progress.find({
      userId: user._id,
      status: "solved",
    })
      .sort({ solvedAt: -1, updatedAt: -1 })
      .lean();

    // Cast to our flexible type
    const solvedProgresses = solvedProgressesRaw as unknown as ProgressDoc[];

    // 5) map to minimal shape the client expects
    const results: SolvedProblemResponse[] = solvedProgresses.map((p) => {
      // Extract problemId - handle both direct ObjectId and populated case
      let problemId = "";
      if (p.problemId) {
        if (
          typeof p.problemId === "object" &&
          p.problemId !== null &&
          "_id" in p.problemId
        ) {
          const populated = p.problemId as { _id?: Types.ObjectId | number };
          problemId = populated._id ? String(populated._id) : "";
        } else {
          problemId = String(p.problemId);
        }
      }

      return {
        problemId,
        title: p.title ?? null,
        topic: p.topic ?? null,
        difficulty: p.difficulty ?? null,
        solvedAt: p.solvedAt ?? p.updatedAt ?? null,
        lastCodeSnippet:
          typeof p.lastCode === "string" ? p.lastCode.slice(0, 800) : null,
      };
    });

    const response = NextResponse.json(results);
    
    // Disable caching to ensure fresh data
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err) {
    console.error("GET /api/progress/solved error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
