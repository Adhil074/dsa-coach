export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Problem } from "@/lib/models/problem";
import { Progress } from "@/lib/models/progress";
import { User } from "@/lib/models/user";
import { Submission } from "@/lib/models/submission";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

//types

type Verdict = "correct_optimal" | "correct_suboptimal" | "incorrect";

interface AuthToken {
  email?: string;
}

interface SubmitBody {
  problemId: string;
  code: string;
  language: string;
  verdict: Verdict;
}

interface IUser {
  _id: Types.ObjectId;
  email: string;
}

interface IProblem {
  _id: Types.ObjectId;
  title?: string;
  topic?: string;
  difficulty?: string;
}

//route

export async function POST(request: NextRequest) {
  try {
    //auth
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as AuthToken | null;

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //parse body
    const body = (await request.json()) as Partial<SubmitBody>;

    if (!body.problemId || !body.code || !body.verdict) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const solvedNow = body.verdict !== "incorrect";

    //db
    await connectToDatabase();

    const user = (await User.findOne({
      email: token.email,
    }).lean()) as IUser | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const problem = (await Problem.findById(
      body.problemId
    ).lean()) as IProblem | null;

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    //save submission
    await Submission.create({
      userId: user._id,
      problemId: problem._id,
      code: body.code,
      language: body.language,
      verdict: body.verdict,
      solved: solvedNow,
      topic: problem.topic ?? "",
      difficulty: problem.difficulty ?? "",
      createdAt: new Date(),
    });

    //Update progress per problem
    await Progress.findOneAndUpdate(
      {
        userId: user._id,
        problemId: problem._id,
      },
      {
        $set: {
          status: solvedNow ? "solved" : "attempted",
          solvedAt: solvedNow ? new Date() : undefined,
          lastCode: body.code,
          language: body.language,
          topic: problem.topic ?? "",
          title: problem.title ?? "",
          difficulty: problem.difficulty ?? "",
          updatedAt: new Date(),
        },
        $inc: {
          submissionCount: 1,
          ...(solvedNow ? {} : { failedAttempts: 1 }),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      solved: solvedNow,
      verdict: body.verdict,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}