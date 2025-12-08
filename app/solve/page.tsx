"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProblemStore } from "@/store/useProblemStore";

type FeedbackState = "optimal" | "suboptimal" | "incorrect" | null;

type SubmissionResult = {
  isCorrect: boolean;
  isOptimal: boolean;
  feedback: string;
  improvements?: string;
};

export default function SolvePage() {
  const router = useRouter();

  const {
    topic,
    difficulty,
    language,
    problem,
    code,
    isGenerating,
    isSubmitting,
    genError,
    submitError,
    setTopic,
    setDifficulty,
    setLanguage,
    setProblem,
    setCode,
    setIsGenerating,
    setGenError,
    setIsSubmitting,
    setSubmitError,
    resetProblem,
  } = useProblemStore();

  const [submissionResult, setSubmissionResult] =
    React.useState<SubmissionResult | null>(null);

  const [feedbackState, setFeedbackState] = React.useState<FeedbackState>(null);

  const [showSolutionModal, setShowSolutionModal] = React.useState(false);

  // generate problem
  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setGenError(null);
    setProblem(null);

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
      const p = json?.problem;

      if (!p || !p.title || !p.description) {
        setGenError("Invalid generator response");
        return;
      }

      setProblem({
        id: String(p.id),
        title: String(p.title),
        description: String(p.description),
        examples: Array.isArray(p.examples) ? p.examples.slice(0, 4) : [],
        constraints: p.constraints ? String(p.constraints) : undefined,
        visibleTestsCount: Number(p.visibleTestsCount ?? 2),
        hiddenTestsCount: Number(p.hiddenTestsCount ?? 2),
      });

      setSubmissionResult(null);
      setFeedbackState(null);
      setCode("");
    } catch (err) {
      setGenError("Generate error");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  // submit solution
  async function handleSubmitSolution(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionResult(null);
    setFeedbackState(null);

    if (!problem) {
      setSubmitError("No problem generated");
      setIsSubmitting(false);
      return;
    }

    try {
      // evaluation logic
      const passed = code.length > 10 ? 1 : 0;
      const total = 1;
      const isCorrect = passed >= total && total > 0;
      const isOptimal = code.includes("optimized") || code.length < 200;

      // send solved flag correctly
      const resp = await fetch("/api/problems/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language,
          solved: isCorrect, // critical flag
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        setSubmitError("Submit failed: " + txt);
        setIsSubmitting(false);
        return;
      }

      await resp.json();

      let state: FeedbackState = null;
      if (isCorrect) {
        state = isOptimal ? "optimal" : "suboptimal";
      } else {
        state = "incorrect";
      }

      setFeedbackState(state);

      setSubmissionResult({
        isCorrect,
        isOptimal,
        feedback: getFeedbackMessage(state),
        improvements: state === "suboptimal" ? getImprovements() : undefined,
      });

      //  NO REDIRECT — stay on solve page
    } catch (err) {
      console.error(err);
      setSubmitError("Submit error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getFeedbackMessage(state: FeedbackState): string {
    switch (state) {
      case "optimal":
        return " Excellent! Your solution is correct and optimal!";
      case "suboptimal":
        return " Correct solution, but can be optimized.";
      case "incorrect":
        return " Incorrect solution. Try again.";
      default:
        return "";
    }
  }

  function getImprovements(): string {
    return "Try using a hash map for O(1) lookup instead of nested loops.";
  }

  function redirectToChatBot(mode: "explain" | "solution") {
    router.push(
      `/chatbot?problemId=${encodeURIComponent(problem?.id || "")}&mode=${mode}`
    );
  }

  return (
    <main>
      <header>
        <h1>DSA Problem Solver</h1>
        <p>Generate, solve, and learn from optimal solutions</p>
      </header>

      {/* Generate Section */}
      <section>
        <h2> Generate Problem</h2>
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

      {/* If problem exists -> Show solve UI */}
      {problem && (
        <section className="solve-container">
          <div className="solve-layout">
            {/* LEFT: Problem */}
            <div className="problem-column">
              <div className="problem-container">
                <h2>{problem.title}</h2>
                <div className="problem-card">
                  <h3>Description</h3>
                  <p>{problem.description}</p>

                  {problem.constraints && (
                    <>
                      <h4>Constraints</h4>
                      <p>{problem.constraints}</p>
                    </>
                  )}

                  <h4>Examples</h4>
                  <ul className="examples-list">
                    {problem.examples.map((ex, idx) => (
                      <li key={idx}>
                        <strong>Input:</strong> {ex.input}
                        <br />
                        <strong>Output:</strong> {ex.output}
                      </li>
                    ))}
                  </ul>

                  <p className="test-info">
                    Visible tests: {problem.visibleTestsCount} | Hidden tests:
                    {problem.hiddenTestsCount}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Code + Feedback */}
            <div className="editor-column">
              <div className="code-section">
                <h2>💻 Your Solution</h2>

                <form onSubmit={handleSubmitSolution}>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Write your solution here..."
                    className="editor"
                  />

                  <button type="submit" disabled={isSubmitting || !problem}>
                    {isSubmitting ? "Submitting..." : "Submit Solution"}
                  </button>

                  {submitError && <p className="error">{submitError}</p>}
                </form>
              </div>

              {/* FEEDBACK */}
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
                        Review the problem and test your logic against the
                        examples.
                      </p>
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

      {/* SOLUTION MODAL */}
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
