// app/api/ai/hints/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

type RunnerResult = {
  input: string;
  expected?: string;
  passed: boolean;
  actual?: unknown;
  error?: string;
  timeMs?: number;
  isHidden?: boolean;
};

type HintRequest = {
  problem?: {
    title?: string;
    description?: string;
    topic?: string;
    difficulty?: string;
  } | null;
  code?: string;
  runner?: {
    success?: boolean;
    passedCount?: number;
    total?: number;
    results?: RunnerResult[];
  } | null;
};

function buildHintsFromRunner(runner?: HintRequest["runner"]): string[] {
  const hints: string[] = [];
  if (!runner || !Array.isArray(runner.results)) {
    hints.push("No runner information available to generate hints.");
    return hints;
  }

  const firstFail = runner.results.find((r) => !r.passed);

  // Timeout / perf issues
  if (firstFail?.error?.toLowerCase().includes("timed out")) {
    hints.push(
      "Your code timed out on a test — try reducing nested loops or use a hash/map to avoid O(n²) behavior."
    );
    return hints;
  }

  // Reference / undefined errors
  if (firstFail?.error && /referenceerror|not defined/i.test(firstFail.error)) {
    hints.push(
      "There is an undefined variable or function — check names, scopes, and spelling."
    );
    return hints;
  }

  // Wrong output shape
  if (firstFail && typeof firstFail.actual !== "undefined") {
    // simple heuristic: if expected looks like JSON array/number/boolean try to suggest return type check
    const exp = String(firstFail.expected ?? "");
    if (/^\[.*\]$/.test(exp) || /^\d+$/.test(exp) || /^true|false$/i.test(exp)) {
      hints.push(
        "Output mismatch — confirm your function returns the right structure (array vs string vs number)."
      );
    } else {
      hints.push("Unexpected output — verify return values for edge cases.");
    }
    return hints;
  }

  // Fallback generic hint
  hints.push("Re-check logic and test using the example inputs step-by-step.");
  return hints;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as HintRequest;
    const hints = buildHintsFromRunner(body.runner);

    return NextResponse.json({
      success: true,
      hints,
      note:
        "This endpoint currently uses simple heuristics. Replace with LLM later for richer suggestions.",
    });
  } catch (err) {
    console.error("Hints error:", err);
    return NextResponse.json(
      { success: false, error: "Server error generating hints" },
      { status: 500 }
    );
  }
}