export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Submission } from "@/lib/models/submission";
import { getToken } from "next-auth/jwt";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || typeof token.sub !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const data = await Submission.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(token.sub),
        },
      },
      {
        $group: {
          _id: {
            topic: "$topic",
            difficulty: "$difficulty",
          },
          attempts: { $sum: 1 },
          incorrect: {
            $sum: {
              $cond: [{ $eq: ["$verdict", "incorrect"] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.topic",
          totalAttempts: { $sum: "$attempts" },
          totalIncorrect: { $sum: "$incorrect" },
          easyFails: {
            $sum: {
              $cond: [{ $eq: ["$_id.difficulty", "easy"] }, "$incorrect", 0],
            },
          },
          mediumFails: {
            $sum: {
              $cond: [{ $eq: ["$_id.difficulty", "medium"] }, "$incorrect", 0],
            },
          },
          hardFails: {
            $sum: {
              $cond: [{ $eq: ["$_id.difficulty", "hard"] }, "$incorrect", 0],
            },
          },
        },
      },
      {
        
        $match: {
          totalIncorrect: { $gte: 3 },
          $expr: {
            $gte: [{ $divide: ["$totalIncorrect", "$totalAttempts"] }, 0.4],
          },
        },
      },
    ]);

    const weakAreas = data.map((t) => {
      let reason = "Concept clarity required";

      if (t.easyFails >= t.mediumFails && t.easyFails >= t.hardFails) {
        reason = "Basics need strengthening";
      } else if (t.mediumFails >= t.easyFails && t.mediumFails >= t.hardFails) {
        reason = "Problem-solving approach needs improvement";
      } else if (t.hardFails > 0) {
        reason = "Advanced concepts need revision";
      }

      return {
        topic: t._id,
        reason,
      };
    });

    const response = NextResponse.json({
      success: true,
      weakAreas,
    });

    // Disable caching to ensure fresh data
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err) {
    console.error("Weak areas error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
