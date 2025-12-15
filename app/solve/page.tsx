"use client";

import React, { JSX } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProblemStore } from "@/store/useProblemStore";

/* ----------------------
   Strict domain types
   ---------------------- */
type ExampleItem = {
  input: string;
  output: string;
  explanation?: string;
};

type TestCaseItem = {
  input: string;
  output: string;
  isHidden: boolean;
};

type BigO = "O(1)" | "O(log n)" | "O(n)" | "O(n log n)" | "O(n^2)";

type ParsedProblem = {
  id: string;
  title: string;
  description: string;
  examples: unknown[];
  constraints?: string;
  visibleTestsCount: number;
  hiddenTestsCount: number;
  testCases: unknown[];
  optimalTime?: BigO;
  optimalSpace?: BigO;
  topic?: string;
  difficulty?: string;
};

export type LocalProblem = {
  id: string;
  title: string;
  description: string;
  examples: ExampleItem[];
  constraints?: string;
  visibleTestsCount: number;
  hiddenTestsCount: number;
  testCases: TestCaseItem[];
  optimalTime?: BigO;
  optimalSpace?: BigO;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
};

type FeedbackState = "optimal" | "suboptimal" | "incorrect" | null;

type SubmissionResult = {
  isCorrect: boolean;
  isOptimal: boolean;
  feedback: string;
  improvements?: string;
};

/* ----------------------
   Safe parsing utilities
   ---------------------- */
function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}
function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function parseExamples(value: unknown): ExampleItem[] {
  if (!Array.isArray(value)) return [];
  const out: ExampleItem[] = [];
  for (const el of value) {
    const r = asRecord(el);
    if (!r) continue;
    if (isString(r.input) && isString(r.output)) {
      out.push({
        input: r.input,
        output: r.output,
        explanation: isString(r.explanation) ? r.explanation : undefined,
      });
    }
  }
  return out;
}

function parseTestCases(value: unknown): TestCaseItem[] {
  if (!Array.isArray(value)) return [];
  const out: TestCaseItem[] = [];
  for (const el of value) {
    const r = asRecord(el);
    if (!r) continue;
    if (
      isString(r.input) &&
      isString(r.output) &&
      typeof r.isHidden === "boolean"
    ) {
      out.push({
        input: r.input,
        output: r.output,
        isHidden: r.isHidden,
      });
    }
  }
  return out;
}

function toBigO(value: unknown): BigO | undefined {
  if (typeof value !== "string") return undefined;

  const allowed: BigO[] = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)"];

  return allowed.includes(value as BigO) ? (value as BigO) : undefined;
}

function parseProblem(doc: unknown, fallbackId?: string): LocalProblem | null {
  const r = asRecord(doc);
  if (!r) return null;

  if (!isString(r.title) || !isString(r.description)) return null;

  const examples = parseExamples(r.examples);
  const testCases = parseTestCases(r.testCases);

  const visibleTestsCount = isNumber(r.visibleTestsCount)
    ? r.visibleTestsCount
    : 2;
  const hiddenTestsCount = isNumber(r.hiddenTestsCount)
    ? r.hiddenTestsCount
    : 2;

  return {
    id:
      (isString(r._id) && r._id) ||
      (isString(r.id) && r.id) ||
      fallbackId ||
      "",
    title: r.title,
    description: r.description,
    examples,
    constraints: isString(r.constraints) ? r.constraints : undefined,
    visibleTestsCount,
    hiddenTestsCount,
    testCases,
    optimalTime: toBigO(r.optimalTime),
    optimalSpace: toBigO(r.optimalSpace),
    topic: isString(r.topic) ? r.topic : undefined,
    difficulty:
      r.difficulty === "easy" ||
      r.difficulty === "medium" ||
      r.difficulty === "hard"
        ? r.difficulty
        : undefined,
  };
}

/* ----------------------
   Component
   ---------------------- */
export default function SolvePage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    topic,
    difficulty,
    language,
    isGenerating,
    isSubmitting,
    genError,
    submitError,
    setTopic,
    setDifficulty,
    setLanguage,
    setIsGenerating,
    setGenError,
    setIsSubmitting,
    setSubmitError,
    resetProblem,
  } = useProblemStore();

  const [localProblem, setLocalProblem] = React.useState<LocalProblem | null>(
    null
  );
  const [localCode, setLocalCode] = React.useState<string>("");
  const [submissionResult, setSubmissionResult] =
    React.useState<SubmissionResult | null>(null);
  const [feedbackState, setFeedbackState] = React.useState<FeedbackState>(null);
  const [showSolutionModal, setShowSolutionModal] =
    React.useState<boolean>(false);

  // NEW: AI hints states
  const [aiHints, setAiHints] = React.useState<string[] | null>(null);
  const [showHints, setShowHints] = React.useState<boolean>(false);

  // roadmap id from URL query
  const roadmapProblemId = searchParams.get("problemId");

  // Auto-load a roadmap problem by id (if present)
  React.useEffect(() => {
    (async () => {
      if (!roadmapProblemId) return;

      // Sync UI selectors if provided in query
      const qTopic = searchParams.get("topic");
      const qDifficulty = searchParams.get("difficulty");
      const qLanguage = searchParams.get("language");

      if (qTopic) setTopic(qTopic);
      if (qDifficulty) setDifficulty(qDifficulty);
      if (qLanguage) setLanguage(qLanguage);

      setIsGenerating(true);
      setGenError(null);
      setLocalProblem(null);
      setLocalCode("");
      setSubmissionResult(null);
      setFeedbackState(null);

      try {
        const url = `/api/roadmap/problem?problemId=${encodeURIComponent(
          roadmapProblemId
        )}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          const txt = await resp.text();
          setGenError("Failed to load roadmap problem: " + txt);
          return;
        }
        const json = await resp.json();
        const doc = json?.problem ?? json;
        const parsed = parseProblem(doc, roadmapProblemId);
        if (!parsed) {
          setGenError("Invalid problem document from roadmap");
          return;
        }
        setLocalProblem(parsed);
      } catch (err) {
        console.error("Error fetching roadmap problem:", err);
        setGenError("Failed to load roadmap problem");
      } finally {
        setIsGenerating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapProblemId]);

  /* ----------------------
     Generate problem (server generator)
     ---------------------- */
  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setGenError(null);
    setLocalProblem(null);
    setLocalCode("");
    setSubmissionResult(null);
    setFeedbackState(null);
    setAiHints(null);
    setShowHints(false);

    try {
      const resp = await fetch("/api/problems/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, language }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        setGenError("Generate failed: " + text);
        return;
      }

      const json = await resp.json();
      const doc = json?.problem ?? json;
      const parsed = parseProblem(doc);

      if (!parsed) {
        setGenError("Invalid generator response");
        return;
      }

      setLocalProblem(parsed);
    } catch (err) {
      console.error("Generate error:", err);
      setGenError("Generate error");
    } finally {
      setIsGenerating(false);
    }
  }

  /* ----------------------
   Submit solution (runner + save + AI evaluation)
   ---------------------- */

  async function handleSubmitSolution(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const solutionNameRegex =
      /\b(?:function|const|let|var|export\s+function)\s+solution\b/;
    if (!solutionNameRegex.test(localCode)) {
      setSubmitError(
        "Please define your solution as: `function solution(...) { ... }`"
      );
      setIsSubmitting(false);
      return;
    }

    setSubmitError(null);
    setSubmissionResult(null);
    setFeedbackState(null);

    if (!localProblem) {
      setSubmitError("No problem generated");
      setIsSubmitting(false);
      return;
    }

    /* ---------- Runner types ---------- */
    type RunnerResult = {
      input: string;
      expected: string;
      passed: boolean;
      actual?: unknown;
      error?: string;
      timeMs?: number;
      isHidden?: boolean;
    };

    type RunnerResponse = {
      success: boolean;
      passedCount: number;
      total: number;
      results: RunnerResult[];
    };

    try {
      /* ---------- 1) Run code ---------- */
      const runResp = await fetch("/api/problems/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: localProblem.id,
          code: localCode,
          language,
          timeoutMs: 1500,
        }),
      });

      if (!runResp.ok) {
        const txt = await runResp.text();
        setSubmitError("Runner error: " + txt);
        setIsSubmitting(false);
        return;
      }

      const runJsonRaw = (await runResp.json()) as
        | (Partial<RunnerResponse> & { success?: boolean })
        | null;

      const runner: RunnerResponse = {
        success: Boolean(runJsonRaw?.success),
        passedCount: Number(runJsonRaw?.passedCount ?? 0),
        total: Number(runJsonRaw?.total ?? 0),
        results: Array.isArray(runJsonRaw?.results)
          ? (runJsonRaw.results as RunnerResult[])
          : [],
      };

      /* ---------- 2) AI evaluation (ONLY truth) ---------- */
      const aiResp = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: {
            title: localProblem.title ?? null,
            description: localProblem.description ?? null,
            difficulty,
            optimalTime: localProblem.optimalTime ?? null,
            optimalSpace: localProblem.optimalSpace ?? null,
          },
          code: localCode,
          runner: {
            passedCount: runner.passedCount,
            total: runner.total,
          },
        }),
      });

      if (!aiResp.ok) {
        throw new Error("AI evaluation failed");
      }

      const aiJson = (await aiResp.json()) as {
        success: boolean;
        verdict: "correct_optimal" | "correct_suboptimal" | "incorrect";
        message: string;
        hint?: string;
      };

      const solvedByAI = aiJson.verdict !== "incorrect";

      /* ---------- 3) Save submission ---------- */
      const saveResp = await fetch("/api/problems/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: localProblem.id,
          code: localCode,
          language,
          solved: solvedByAI,
        }),
      });

      if (!saveResp.ok) {
        const txt = await saveResp.text();
        setSubmitError("Save error: " + txt);
      }

      /* ---------- 4) Update UI from AI ---------- */
      setSubmissionResult({
        isCorrect: solvedByAI,
        isOptimal: aiJson.verdict === "correct_optimal",
        feedback: aiJson.message,
        improvements: aiJson.hint,
      });

      setFeedbackState(
        aiJson.verdict === "correct_optimal"
          ? "optimal"
          : aiJson.verdict === "correct_suboptimal"
          ? "suboptimal"
          : "incorrect"
      );
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Submit error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function redirectToChatBot(arg0: string) {
    throw new Error("Function not implemented.");
  }

  /* ----------------------
     UI
     ---------------------- */
  return (
    <main>
      <header>
        <h1>DSA Problem Solver</h1>
        <p>Generate, solve, and learn from optimal solutions</p>
      </header>

      <section>
        <h2>Generate Problem</h2>
        <form onSubmit={handleGenerate}>
          <div>
            <label>Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="graphs">Graphs</option>
              <option value="trees">Trees</option>
              <option value="dp">Dynamic Programming</option>
            </select>
          </div>

          <div>
            <label>Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <button type="submit" disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Problem"}
          </button>

          {genError && <p className="error">{genError}</p>}
        </form>
      </section>

      {localProblem && (
        <section className="solve-container">
          <div className="solve-layout">
            <div className="problem-column">
              <div className="problem-container">
                <h2>{localProblem.title}</h2>
                <div className="problem-card">
                  <h3>Description</h3>
                  <p>{localProblem.description}</p>

                  {localProblem.constraints && (
                    <>
                      <h4>Constraints</h4>
                      <p>{localProblem.constraints}</p>
                    </>
                  )}

                  <h4>Examples</h4>
                  <ul className="examples-list">
                    {localProblem.examples.map(
                      (ex: ExampleItem, idx: number) => (
                        <li key={idx}>
                          <strong>Input:</strong> {ex.input}
                          <br />
                          <strong>Output:</strong> {ex.output}
                        </li>
                      )
                    )}
                  </ul>

                  {localProblem.testCases.length > 0 && (
                    <>
                      <h4>Test Cases (visible)</h4>
                      <ul className="testcases-list">
                        {localProblem.testCases
                          .filter((tc) => !tc.isHidden)
                          .map((tc: TestCaseItem, idx: number) => (
                            <li key={idx}>
                              <strong>Input:</strong> {tc.input}
                              <br />
                              <strong>Output:</strong> {tc.output}
                            </li>
                          ))}
                      </ul>
                    </>
                  )}

                  <p className="test-info">
                    Visible tests: {localProblem.visibleTestsCount} | Hidden
                    tests: {localProblem.hiddenTestsCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="editor-column">
              <div className="code-section">
                <h2> Your Solution</h2>

                <form onSubmit={handleSubmitSolution}>
                  <p
                    style={{
                      color: "#ffaa00",
                      fontSize: "0.9rem",
                      marginBottom: "6px",
                    }}
                  >
                    ⚠️ Your function must be named <strong>solution</strong>.
                    Example:{" "}
                    <code>
                      function solution(...) {"{"} ... {"}"}
                    </code>
                  </p>
                  <textarea
                    value={localCode}
                    onChange={(e) => setLocalCode(e.target.value)}
                    placeholder="// Write your solution here..."
                    className="editor"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !localProblem}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Solution"}
                  </button>

                  {submitError && <p className="error">{submitError}</p>}
                </form>
              </div>

              {feedbackState && submissionResult && (
                <div className={`feedback feedback-${feedbackState}`}>
                  <h2>{submissionResult.feedback}</h2>

                  {feedbackState === "optimal" && (
                    <div className="optimal-actions">
                      <button onClick={() => handleGenerate()}>
                        Next Problem
                      </button>
                      <button onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                      </button>
                    </div>
                  )}

                  {feedbackState === "suboptimal" && (
                    <div>
                      <h3> Suggested Improvements</h3>
                      <p>{submissionResult.improvements}</p>

                      {/* AI Hints toggle (optional) */}
                      {aiHints && aiHints.length > 0 && (
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() => setShowHints((s) => !s)}
                            style={{ marginRight: 8 }}
                          >
                            {showHints ? "Hide Hints" : "Show Hints"}
                          </button>
                          {showHints && (
                            <div
                              style={{
                                marginTop: 8,
                                background: "#f7f7f7",
                                padding: 8,
                                borderRadius: 6,
                              }}
                            >
                              <strong>Hints</strong>
                              <ul style={{ marginTop: 8 }}>
                                {aiHints.map((h, i) => (
                                  <li key={i} style={{ marginBottom: 6 }}>
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="actions">
                        <button onClick={() => setShowSolutionModal(true)}>
                          See Optimal Solution
                        </button>
                      </div>
                    </div>
                  )}

                  {feedbackState === "incorrect" && (
                    <div>
                      <p>
                        Oops — your solution is incorrect. Review the problem
                        and try again.
                      </p>

                      {/* AI Hints toggle (optional) */}
                      {aiHints && aiHints.length > 0 && (
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() => setShowHints((s) => !s)}
                            style={{ marginRight: 8 }}
                          >
                            {showHints ? "Hide Hints" : "Show Hints"}
                          </button>
                          {showHints && (
                            <div
                              style={{
                                marginTop: 8,

                                padding: 8,
                                borderRadius: 6,
                              }}
                            >
                              <strong>Hints</strong>
                              <ul style={{ marginTop: 8 }}>
                                {aiHints.map((h, i) => (
                                  <li key={i} style={{ marginBottom: 6 }}>
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="actions">
                        <button onClick={() => setShowSolutionModal(true)}>
                          Show Solution
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {showSolutionModal && (
        <div className="modal">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setShowSolutionModal(false)}
            >
              ✕
            </button>
            <h2>How would you like to proceed?</h2>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowSolutionModal(false);
                  redirectToChatBot("explain");
                }}
              >
                Explain Concept First
              </button>
              <button
                onClick={() => {
                  setShowSolutionModal(false);
                  redirectToChatBot("solution");
                }}
              >
                Get Direct Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
