import { NextResponse } from "next/server";

type TestCase = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

type Body = {
  code?: string;
  language?: string;
  tests?: TestCase[];
};

const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

// Parse input to JSON format
function parseToJSON(input: string): Record<string, unknown> {
  const s = (input ?? "").trim();
  if (!s) return {};

  // Try direct JSON first
  try {
    const maybe = JSON.parse(s);
    if (typeof maybe === "object" && maybe !== null) return maybe as Record<string, unknown>;
  } catch {
    // ignore
  }

  // Pattern: nums = [1,2,3], target = 6
  try {
    const numsMatch = s.match(/nums\s*=\s*(\[[^\]]*\])/i);
    const targetMatch = s.match(/target\s*=\s*([-\d]+)/i);
    if (numsMatch) {
      const nums = JSON.parse(numsMatch[1]);
      if (Array.isArray(nums)) {
        const out: Record<string, unknown> = { nums };
        if (targetMatch) out.target = Number(targetMatch[1]);
        return out;
      }
    }
  } catch {
    // fallthrough
  }

  // Two-line format: "1 2 3\n6"
  const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const firstNums = lines[0].split(/[\s,]+/).map((t) => Number(t)).filter((n) => !Number.isNaN(n));
    const secondNum = Number(lines[1]);
    if (firstNums.length > 0 && !Number.isNaN(secondNum)) {
      return { nums: firstNums, target: secondNum };
    }
  }

  // Single line: "1 2 3 6" (last is target)
  const tokens = s.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  const numsCandidate = tokens.map((t) => Number(t)).filter((n) => !Number.isNaN(n));
  if (numsCandidate.length >= 2) {
    return { nums: numsCandidate.slice(0, -1), target: numsCandidate[numsCandidate.length - 1] };
  }

  return { raw: s };
}

function normalizeOutput(s: string | null | undefined) {
  if (s == null) return "";
  return String(s).replace(/\r\n/g, "\n").trim();
}

// Run single test on Judge0
async function runOneTest(
  languageId: number,
  sourceCode: string,
  stdinJsonString: string
): Promise<{
  stdout: string;
  stderr: string;
  status: string;
  time: string | null;
  memory: string | null;
}> {
  const judge0Url = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
  const apiKey = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_JUDGE0_KEY;

  if (!apiKey) {
    throw new Error("JUDGE0_API_KEY or RAPIDAPI_JUDGE0_KEY is not set in environment variables");
  }

  const url = `${judge0Url}/submissions?base64_encoded=false&wait=true`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // RapidAPI specific headers
  if (judge0Url.includes("rapidapi")) {
    headers["X-RapidAPI-Key"] = apiKey;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  } else {
    // Self-hosted Judge0
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const body = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdinJsonString,
  };

  console.log("Judge0 Request:", { url, headers: Object.keys(headers), bodyLength: sourceCode.length });

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  console.log("Judge0 Response Status:", resp.status);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("Judge0 Error Response:", text);
    throw new Error(`Judge0 API error (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  console.log("Judge0 Response Data:", data);

  return {
    stdout: data.stdout ?? "",
    stderr: data.stderr ?? "",
    status: data.status?.description ?? "unknown",
    time: data.time ?? null,
    memory: data.memory ?? null,
  };
}

// Main route handler
export async function POST(req: Request) {
  try {
    const body: Body = await req.json().catch(() => ({}));

    const code = body.code;
    const language = body.language ?? "javascript";
    const tests = Array.isArray(body.tests) ? body.tests : [];

    // Validation
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code (string) is required" }, { status: 400 });
    }
    if (!language || typeof language !== "string") {
      return NextResponse.json({ error: "language is required" }, { status: 400 });
    }
    if (!tests.length) {
      return NextResponse.json({ error: "tests (non-empty array) required" }, { status: 400 });
    }

    const langKey = language.toLowerCase();
    const languageId = LANGUAGE_MAP[langKey];
    if (!languageId) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const results: Array<{
      input: string;
      expectedOutput: string;
      stdout: string;
      stderr?: string;
      status: string;
      passed: boolean;
      time?: string | null;
      memory?: string | null;
      isHidden?: boolean;
    }> = [];

    let passedCount = 0;

    // Run tests sequentially
    for (const tc of tests) {
      try {
        const rawInput = tc.input ?? "";
        const expected = tc.expectedOutput ?? "";
        const parsed = parseToJSON(rawInput);
        const stdinForJudge = JSON.stringify(parsed);

        const r = await runOneTest(languageId, code, stdinForJudge);

        const stdout = r.stdout ?? "";
        const outNorm = normalizeOutput(stdout);
        const expectedNorm = normalizeOutput(expected);

        const passed = outNorm === expectedNorm;

        if (passed) passedCount++;

        results.push({
          input: rawInput,
          expectedOutput: expected,
          stdout,
          stderr: r.stderr ?? undefined,
          status: r.status ?? "unknown",
          passed,
          time: r.time ?? null,
          memory: r.memory ?? null,
          isHidden: !!tc.isHidden,
        });
      } catch (testError) {
        console.error("Test execution error:", testError);
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          stdout: "",
          stderr: testError instanceof Error ? testError.message : "Test execution failed",
          status: "Error",
          passed: false,
          isHidden: !!tc.isHidden,
        });
      }
    }

    const total = results.length;
    const solved = results.every((x) => x.passed);

    return NextResponse.json({
      results,
      passedCount,
      total,
      solved,
    });
  } catch (err) {
    console.error("Run tests error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}