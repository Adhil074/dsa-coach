// app/api/ai/evaluate/route.ts
import { NextResponse } from "next/server";

/* ---------- Types ---------- */

type BigO = "O(1)" | "O(log n)" | "O(n)" | "O(n log n)" | "O(n^2)";

type ProblemSummary = {
  title: string | null;
  description: string | null;
  difficulty: string | null;
  optimalTime: BigO | null;
};

type EvaluateRequest = {
  problem: ProblemSummary;
  code: string;
  runner: {
    passedCount: number;
    total: number;
  };
};

type Verdict = "correct_optimal" | "correct_suboptimal" | "incorrect";

/* ---------- STRONG DETERMINISTIC CLASSIFIER ---------- */
function classifyTimeComplexity(code: string): BigO {
  const normalized = code.replace(/\s+/g, " ").toLowerCase();

  const loopCount =
    (normalized.match(/\bfor\s*\(/g)?.length ?? 0) +
    (normalized.match(/\bwhile\s*\(/g)?.length ?? 0);

  // 2 or more loops → assume O(n^2)
  if (loopCount >= 2) return "O(n^2)";

  // Hash-based linear scan
  if (
    normalized.includes("new map") ||
    normalized.includes("map(") ||
    normalized.includes("object") ||
    normalized.includes("{}")
  ) {
    return "O(n)";
  }

  // Single loop
  if (loopCount === 1) return "O(n)";

  return "O(1)";
}

/* ---------- POST ---------- */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvaluateRequest;

    const isCorrect =
      body.runner.total > 0 && body.runner.passedCount === body.runner.total;

    let verdict: Verdict;

    if (!isCorrect) {
      verdict = "incorrect";
    } else {
      const detected = classifyTimeComplexity(body.code);

      verdict =
        body.problem.optimalTime && detected === body.problem.optimalTime
          ? "correct_optimal"
          : "correct_suboptimal";
    }

    return NextResponse.json({
      success: true,
      verdict,
      message:
        verdict === "correct_optimal"
          ? "Your solution is correct and optimal."
          : verdict === "correct_suboptimal"
          ? "Your solution is correct but can be optimized."
          : "Your solution is incorrect.",
      hint:
        verdict === "correct_suboptimal"
          ? "Try a more efficient approach."
          : verdict === "incorrect"
          ? "Check logic and edge cases."
          : undefined,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Evaluation failed" },
      { status: 500 }
    );
  }
}
