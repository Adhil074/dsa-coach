// app/api/problems/run/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import vm from "vm";
import { connectToDatabase } from "../../../../../lib/db";
import { Problem } from "../../../../../lib/models/problem";
import { Types } from "mongoose";

type RunRequestBody = {
  problemId: string;
  code: string; // user-submitted JS code (string)
  language?: string; // only "javascript" supported
  timeoutMs?: number;
};

type TestCaseItem = {
  input: string;
  output: string;
  isHidden?: boolean;
};

type ProblemDoc = {
  _id?: unknown;
  title?: string;
  description?: string;
  examples?: Array<{ input: string; output: string }>;
  testCases?: TestCaseItem[];
  constraints?: string | null;
  topic?: string;
  difficulty?: string;
};

/** Naive parser to extract variable names from "a=1;b=[1,2];" style strings */
function parseArgNamesFromInput(input: string): string[] {
  const parts = input
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const names: string[] = [];
  for (const p of parts) {
    const m = p.match(/^(?:const|let|var)?\s*([A-Za-z_$][\w$]*)\s*=/);
    if (m && m[1]) names.push(m[1]);
  }
  return names;
}

/** Find a usable function name in the VM context */

// keep `import vm from "vm"` at top
const findUserFunctionName = (context: vm.Context): string | null => {
  const preferred = ["solution", "solve", "handler", "fn"];
  for (const name of preferred) {
    const val = (context as Record<string, unknown>)[name];
    if (typeof val === "function") {
      const fn = val as (...args: unknown[]) => unknown;
      if (!fn.toString().includes("[native code]")) return name;
    }
  }
  for (const k of Object.keys(context)) {
    const val = (context as Record<string, unknown>)[k];
    if (typeof val === "function") {
      const fn = val as (...args: unknown[]) => unknown;
      if (!fn.toString().includes("[native code]")) return k;
    }
  }
  return null;
};
export async function POST(request: Request) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<RunRequestBody>;
    const problemId = String(body.problemId ?? "");
    const code = String(body.code ?? "");
    const language = String(body.language ?? "javascript");
    const timeoutMs = Number(body.timeoutMs ?? 1500);

    if (!problemId || !code) {
      return NextResponse.json(
        { error: "problemId and code are required" },
        { status: 400 }
      );
    }
    if (language !== "javascript") {
      return NextResponse.json(
        { error: "Only javascript is supported for runner" },
        { status: 400 }
      );
    }
    if (!Types.ObjectId.isValid(problemId)) {
      return NextResponse.json({ error: "Invalid problemId" }, { status: 400 });
    }

    await connectToDatabase();

    const problemDocRaw = await Problem.findById(problemId).lean();
    const problemDoc = problemDocRaw as unknown as ProblemDoc | null;
    if (!problemDoc) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const testCases = Array.isArray(problemDoc.testCases)
      ? problemDoc.testCases
      : [];
    if (testCases.length === 0) {
      return NextResponse.json(
        { error: "No test cases available for this problem" },
        { status: 400 }
      );
    }

    // sandbox globals template
    const sandboxGlobalsTemplate: Record<string, unknown> = {
      console: {
        log: (..._args: unknown[]) => {
          /* no-op */
        },
        error: (..._args: unknown[]) => {
          /* no-op */
        },
      },
      Date,
      // allow module.exports style
      module: { exports: {} },
      exports: {},
    };

    // Pre-compile user code once (compilation errors will be caught here)
    let userScript: vm.Script;
    try {
      userScript = new vm.Script(String(code), { filename: "user-code.js" });
    } catch (compileErr) {
      const msg =
        compileErr instanceof Error ? compileErr.message : String(compileErr);
      return NextResponse.json(
        { error: "Compilation error: " + msg },
        { status: 400 }
      );
    }

    type TestResult = {
      input: string;
      expected: string;
      passed: boolean;
      actual?: unknown;
      error?: string;
      timeMs?: number;
      isHidden?: boolean;
    };

    const results: TestResult[] = [];

    // Run each testcase in its own fresh context to avoid state bleed
    for (const tc of testCases) {
      const inputStr = String(tc.input ?? "");
      const expectedStr = String(tc.output ?? "");
      const testStart = Date.now();

      try {
        const ctx = vm.createContext(Object.assign({}, sandboxGlobalsTemplate));
        // run user's code
        userScript.runInContext(ctx, { timeout: Math.max(500, timeoutMs) });

        // run the input assignments (e.g., nums=[...];target=9;)
        if (inputStr.trim().length > 0) {
          const inputScript = new vm.Script(inputStr, {
            filename: "test-input.js",
          });
          inputScript.runInContext(ctx, {
            timeout: Math.max(200, timeoutMs / 4),
          });
        }

        // determine arg names
        const argNames = parseArgNamesFromInput(inputStr);

        // find candidate function name
        const fnName = findUserFunctionName(ctx);
        if (!fnName) {
          results.push({
            input: inputStr,
            expected: expectedStr,
            passed: false,
            error:
              "No callable function found in submitted code (look for 'solution'/'solve' or any top-level function).",
            timeMs: Date.now() - testStart,
            isHidden: Boolean(tc.isHidden),
          });
          continue;
        }

        // build invocation expression referencing the arg names, fallback to no-arg call
        const argsExpr = argNames.length > 0 ? argNames.join(", ") : "";
        const callSrc = `
          (function(){
            try {
              const fn = ${fnName};
              const result = (typeof fn === "function") ? fn(${argsExpr}) : undefined;
              return { ok: true, value: result };
            } catch (e) {
              return { ok: false, error: (e && e.message) ? e.message : String(e) };
            }
          })()
        `;
        const callScript = new vm.Script(callSrc, {
          filename: "call-user-fn.js",
        });
        const callRes = callScript.runInContext(ctx, {
          timeout: Math.max(200, timeoutMs / 2),
        }) as { ok: boolean; value?: unknown; error?: string };

        if (!callRes || !callRes.ok) {
          results.push({
            input: inputStr,
            expected: expectedStr,
            passed: false,
            error: callRes?.error ?? "Runtime error during function call",
            timeMs: Date.now() - testStart,
            isHidden: Boolean(tc.isHidden),
          });
          continue;
        }

        const actual = callRes.value;

        // compare actual vs expected: try JSON.parse expected then stringify both
        let expectedParsed: unknown = expectedStr;
        try {
          expectedParsed = JSON.parse(expectedStr);
        } catch {
          expectedParsed = expectedStr;
        }

        const actualString = (() => {
          try {
            return JSON.stringify(actual);
          } catch {
            return String(actual);
          }
        })();

        const expectedString = (() => {
          try {
            return JSON.stringify(expectedParsed);
          } catch {
            return String(expectedParsed);
          }
        })();

        const passed = actualString === expectedString;

        results.push({
          input: inputStr,
          expected: expectedStr,
          passed,
          actual,
          timeMs: Date.now() - testStart,
          isHidden: Boolean(tc.isHidden),
        });
      } catch (err) {
        const e = err instanceof Error ? err.message : String(err);
        results.push({
          input: inputStr,
          expected: expectedStr,
          passed: false,
          error: e,
          timeMs: Date.now() - testStart,
          isHidden: Boolean(tc.isHidden),
        });
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const total = results.length;
    const success = total > 0 && passedCount === total;

    return NextResponse.json({
      success,
      passedCount,
      total,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Runner error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
