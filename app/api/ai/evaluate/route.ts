import { NextResponse } from "next/server";

//types
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

//classifier
function classifyTimeComplexity(code: string): BigO {
  // Remove comments and strings to avoid false positives
  const cleaned = code
    .replace(/\/\/.*$/gm, "") // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // multi-line comments
    .replace(/"[^"]*"/g, '""') // string literals
    .replace(/'[^']*'/g, "''") // string literals
    .replace(/`[^`]*`/g, "``"); // template literals

  const normalized = cleaned.replace(/\s+/g, " ").toLowerCase();

  // Check for nested loops (
  const nestedLoopPattern =
    /\b(for|while)\s*\([^)]*\)\s*\{[^}]*\b(for|while)\s*\(/gi;

  if (nestedLoopPattern.test(cleaned)) {
    return "O(n^2)";
  }

  // Count total loops more accurately
  const forLoops = (cleaned.match(/\bfor\s*\(/g) || []).length;
  const whileLoops = (cleaned.match(/\bwhile\s*\(/g) || []).length;
  const loopCount = forLoops + whileLoops;

  // Check for sorting (O(n log n))
  if (
    normalized.includes(".sort(") ||
    normalized.includes("quicksort") ||
    normalized.includes("mergesort") ||
    normalized.includes("heapsort")
  ) {
    return "O(n log n)";
  }

  // Check for binary search patterns (O(log n))
  if (
    (normalized.includes("binary") && normalized.includes("search")) ||
    (normalized.includes("while") &&
      (normalized.includes("left") || normalized.includes("start")) &&
      (normalized.includes("right") || normalized.includes("end")) &&
      (normalized.includes("mid") || normalized.includes("middle")))
  ) {
    return "O(log n)";
  }

  // Multiple sequential loops = still O(n)
  if (loopCount >= 2 && !nestedLoopPattern.test(cleaned)) {
    return "O(n)";
  }

  // Hash-based solution with single pass
  const hasHashMap =
    normalized.includes("new map(") ||
    normalized.includes("new set(") ||
    normalized.includes("new weakmap(") ||
    normalized.includes("new weakset(");

  if (hasHashMap && loopCount >= 1) {
    return "O(n)";
  }

  // Array methods that iterate (but not nested)
  const arrayMethods = [
    ".map(",
    ".filter(",
    ".reduce(",
    ".foreach(",
    ".find(",
    ".some(",
    ".every(",
  ];
  const hasArrayMethod = arrayMethods.some((method) =>
    normalized.includes(method)
  );

  if (hasArrayMethod && loopCount === 0) {
    return "O(n)";
  }

  // Single loop
  if (loopCount === 1) {
    return "O(n)";
  }

  // No loops, no iteration = constant time
  return "O(1)";
}

//post
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvaluateRequest;

    const isCorrect =
      body.runner.total > 0 && body.runner.passedCount === body.runner.total;

    let verdict: Verdict;

    if (!isCorrect) {
      verdict = "incorrect";
    } else {
      // Check if optimalTime is null/undefined
      if (!body.problem.optimalTime) {
        console.warn("⚠️ WARNING: Problem has no optimalTime defined!");
        console.warn("Problem:", body.problem.title);

        // When no optimal time is defined, just mark as correct

        verdict = "correct_optimal";
      } else {
        const detected = classifyTimeComplexity(body.code);

        console.log("=== Complexity Analysis ===");
        console.log("Problem:", body.problem.title);
        console.log("Expected complexity:", body.problem.optimalTime);
        console.log("Detected complexity:", detected);
        console.log("========================");

        verdict =
          detected === body.problem.optimalTime
            ? "correct_optimal"
            : "correct_suboptimal";
      }
    }

    return NextResponse.json({
      success: true,
      verdict,
      message:
        verdict === "correct_optimal"
          ? "🎉 Your solution is correct and optimal!"
          : verdict === "correct_suboptimal"
          ? "✅ Your solution is correct but can be optimized."
          : "❌ Your solution is incorrect. Check test cases.",
      hint:
        verdict === "correct_suboptimal" && body.problem.optimalTime
          ? `Try to achieve ${body.problem.optimalTime} time complexity.`
          : verdict === "incorrect"
          ? "Review your logic and edge cases carefully."
          : undefined,
    });
  } catch (err) {
    console.error("Evaluation error:", err);
    return NextResponse.json(
      { success: false, message: "Evaluation failed" },
      { status: 500 }
    );
  }
}
