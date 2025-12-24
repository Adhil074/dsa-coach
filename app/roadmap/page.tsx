"use client";

import React, { JSX } from "react";
import { useRouter } from "next/navigation";
import { ROADMAP, RoadmapPhase } from "../../../lib/roadmapConfiig";

type RoadmapItem = {
  problemId: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  solved?: boolean;
};

export default function RoadmapPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = React.useState<RoadmapItem[]>([]);
  const [expandedPhase, setExpandedPhase] = React.useState<string | null>(
    "phase-1"
  );

  React.useEffect(() => {
    fetch("/api/roadmap")
      .then((res) => res.json())
      .then((data) => {
        const list: RoadmapItem[] = Array.isArray(data) ? data : data.roadmap;
        setItems(list);
      });
  }, []);

  const solvedProblemIds = new Set(
    items.filter((p) => p.solved === true).map((p) => p.problemId)
  );

  function getPhaseProblems(phase: RoadmapPhase): RoadmapItem[] {
    return items
      .filter(
        (p) =>
          phase.topics.includes(p.topic) &&
          phase.difficulties.includes(p.difficulty ?? "")
      )
      .sort((a, b) => {
        const order = { easy: 1, medium: 2, hard: 3 };
        return order[a.difficulty] - order[b.difficulty];
      });
  }

  function isPhaseUnlocked(phase: RoadmapPhase): boolean {
    if (!phase.unlockRule) return true;
    const prevPhase = ROADMAP.find(
      (p) => p.id === phase.unlockRule?.requiredPhaseId
    );
    if (!prevPhase) return false;

    const prevProblems = getPhaseProblems(prevPhase);
    const solvedCount = prevProblems.filter((p) =>
      solvedProblemIds.has(p.problemId)
    ).length;

    return solvedCount / prevProblems.length >= 0.7;
  }

  function getNextProblem(phase: RoadmapPhase): string | null {
    const problems = getPhaseProblems(phase);
    const next = problems.find((p) => !solvedProblemIds.has(p.problemId));
    return next ? next.problemId : null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <h1 className="text-2xl font-semibold mb-6">Learning Roadmap</h1>

      <div className="space-y-6">
        {ROADMAP.sort((a, b) => a.order - b.order).map((phase) => {
          const unlocked = isPhaseUnlocked(phase);
          const phaseProblems = getPhaseProblems(phase);
          const solvedCount = phaseProblems.filter((p) =>
            solvedProblemIds.has(p.problemId)
          ).length;

          const progress =
            phaseProblems.length === 0
              ? 0
              : Math.round((solvedCount / phaseProblems.length) * 100);

          const nextProblemId = getNextProblem(phase);

          return (
            <section
              key={phase.id}
              className={`rounded-xl border p-5 ${
                unlocked ? "bg-slate-900" : "bg-slate-900 opacity-50"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  unlocked &&
                  setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
                }
              >
                <div>
                  <h2 className="text-xl font-semibold">{phase.title}</h2>
                  <p className="text-sm text-slate-400">{phase.description}</p>
                </div>

                {!unlocked && <span className="text-sm">🔒 Locked</span>}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-slate-800 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {solvedCount}/{phaseProblems.length} completed
                </p>
              </div>

              {/* AI Phase Explain */}
              <button
                onClick={() =>
                  router.push(`/ai?type=phase&phaseId=${phase.id}`)
                }
                className="mt-3 text-sm text-blue-400 hover:underline"
              >
                🤖 Explain this phase
              </button>

              {/* Phase Problems */}
              {expandedPhase === phase.id && (
                <div className="mt-4 space-y-3">
                  {phaseProblems.map((p) => {
                    const solved = solvedProblemIds.has(p.problemId);
                    const isNext = nextProblemId === p.problemId;

                    return (
                      <div
                        key={p.problemId}
                        className="flex justify-between items-center bg-slate-950 p-4 rounded-lg"
                      >
                        <div>
                          <div className="font-semibold">
                            {p.title}{" "}
                            {isNext && (
                              <span className="ml-2 text-xs text-green-400">
                                NEXT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {p.topic} • {p.difficulty}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              router.push(`/solve?problemId=${p.problemId}`)
                            }
                            className="px-3 py-1 text-sm bg-slate-800 rounded hover:bg-slate-700"
                          >
                            Open
                          </button>

                          <button
                            onClick={() =>
                              router.push(
                                `/ai?type=concept&problemId=${p.problemId}`
                              )
                            }
                            className="text-sm text-blue-400 hover:underline"
                          >
                            Explain
                          </button>

                          <a
                            href="https://www.w3schools.com/dsa/"
                            target="_blank"
                            className="text-sm text-purple-400 hover:underline"
                          >
                            Docs
                          </a>

                          {solved && <span>✅</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
