"use client";

import React from "react";
import { useRouter } from "next/navigation";

type TopicStats = {
  solved: number;
  attempts: number;
  failed: number;
};

type DifficultyStats = {
  solved: number;
  attempts: number;
  failed: number;
};

type SummaryResponse = {
  totalSolved: number;
  totalAttempts: number;
  failedAttempts: number;
  topicStats: Record<string, TopicStats>;
  difficultyStats: Record<"easy" | "medium" | "hard", DifficultyStats>;
};

type WeakArea = {
  topic: string;
  reason: string;
  count: number;
};
type StruggledProblem = {
  problemId: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  incorrectCount: number;
  suboptimalCount: number;
};

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const [weakAreas, setWeakAreas] = React.useState<WeakArea[]>([]);
  const [struggledProblems, setStruggledProblems] = React.useState<
    StruggledProblem[]
  >([]);

  React.useEffect(() => {
    fetch("/api/progress/struggled-problems")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setStruggledProblems(data.struggledProblems || []);
      })
      .catch((err) => {
        console.error("Struggled problems fetch failed:", err);
      });
  }, []);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/progress/summary").then(async (res) => {
        if (!res.ok) throw new Error("Summary fetch failed");
        return (await res.json()) as SummaryResponse;
      }),
      fetch("/api/progress/weak-areas").then(async (res) => {
        if (!res.ok) return { weakAreas: [] };
        return await res.json();
      }),
    ])
      .then(([summaryData, weakAreaData]) => {
        if (!mounted) return;
        setSummary(summaryData);
        setWeakAreas(weakAreaData.weakAreas || []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError("Unable to load progress.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function openRoadmapForTopic(topic: string) {
    router.push(`/roadmap?topic=${encodeURIComponent(topic)}`);
  }

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Progress</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Progress</h1>
        <p className="text-red-500">{error ?? "No data"}</p>
      </main>
    );
  }

  const topics = Object.keys(summary.topicStats).map((t) => ({
    topic: t,
    stats: summary.topicStats[t],
  }));

  return (
    <main className="p-6">
      <header className="mb-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-1.5 bg-slate-800 text-sm hover:bg-slate-700 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-3xl font-bold">Your Progress</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your attempts, failures, and struggled areas.
        </p>
      </header>

      {/* Top stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded bg-slate-900">
          <h3 className="text-lg font-semibold">Total Solved</h3>
          <div className="text-2xl mt-2">{summary.totalSolved}</div>
        </div>

        <div className="p-4 rounded bg-slate-900">
          <h3 className="text-lg font-semibold">Total Attempts</h3>
          <div className="text-2xl mt-2">{summary.totalAttempts}</div>
        </div>

        <div className="p-4 rounded bg-slate-900">
          <h3 className="text-lg font-semibold">Failed Attempts</h3>
          <div className="text-2xl mt-2">{summary.failedAttempts}</div>
        </div>
      </section>

      {/* Weak areas detected */}
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3">Weak Areas Detected</h2>

        {weakAreas.length === 0 && (
          <p className="text-sm text-gray-400">
            No weak areas detected yet. Good job.
          </p>
        )}

        <div className="space-y-3">
          {weakAreas.map((w) => (
            <div
              key={w.topic}
              className="p-3 rounded bg-slate-800 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold capitalize">{w.topic}</div>
                <div className="text-sm text-gray-300">{w.reason}</div>
              </div>

              <button
                onClick={() => openRoadmapForTopic(w.topic)}
                className="px-3 py-1 bg-indigo-600 rounded text-white text-sm"
              >
                Practice
              </button>
            </div>
          ))}
        </div>
      </section>
      {/* Topic breakdown */}
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3">Topic Breakdown</h2>

        <div className="space-y-3">
          {topics.map((t) => {
            const topicStruggled = struggledProblems.filter(
              (p) => p.topic === t.topic
            );

            return (
              <div key={t.topic} className="p-3 rounded bg-slate-800">
                <div className="font-semibold capitalize">{t.topic}</div>

                <div className="text-sm text-gray-300 mb-2">
                  solved: {t.stats.solved} • attempts: {t.stats.attempts} •
                  failed: {t.stats.failed}
                </div>

                {/* Struggled problems */}
                {topicStruggled.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-red-400 mb-1">
                      Struggled problems:
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {topicStruggled.map((p) => (
                        <button
                          key={p.problemId}
                          onClick={() =>
                            router.push(
                              `/solve?problemId=${encodeURIComponent(
                                p.problemId
                              )}`
                            )
                          }
                          className="px-2 py-1 bg-red-700 rounded text-sm"
                          title={`Incorrect: ${p.incorrectCount}, Suboptimal: ${p.suboptimalCount}`}
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Difficulty breakdown */}
      <section>
        <h2 className="text-2xl font-bold mb-3">Difficulty Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["easy", "medium", "hard"] as const).map((d) => {
            const s = summary.difficultyStats[d];
            return (
              <div key={d} className="p-3 rounded bg-slate-800 text-sm">
                <div className="font-semibold capitalize">{d}</div>
                <div className="text-gray-300 mt-1">
                  solved: {s.solved} <br />
                  attempts: {s.attempts} <br />
                  failed: {s.failed}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
