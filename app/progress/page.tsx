// "use client";

// import React from "react";
// import { useRouter } from "next/navigation";

// type TopicStats = {
//   solved: number;
//   attempts: number;
//   failed: number;
// };

// type DifficultyStats = {
//   solved: number;
//   attempts: number;
//   failed: number;
// };

// type SummaryResponse = {
//   totalSolved: number;
//   totalAttempts: number;
//   failedAttempts: number;
//   topicStats: Record<string, TopicStats>;
//   difficultyStats: Record<"easy" | "medium" | "hard", DifficultyStats>;
// };

// export default function ProgressPage() {
//   const router = useRouter();
//   const [loading, setLoading] = React.useState<boolean>(true);
//   const [error, setError] = React.useState<string | null>(null);
//   const [summary, setSummary] = React.useState<SummaryResponse | null>(null);

//   React.useEffect(() => {
//     let mounted = true;
//     setLoading(true);
//     setError(null);

//     fetch("/api/progress/summary")
//       .then(async (res) => {
//         if (!res.ok) {
//           const txt = await res.text().catch(() => "Bad response");
//           throw new Error(txt || "Fetch error");
//         }
//         return (await res.json()) as SummaryResponse;
//       })
//       .then((data) => {
//         if (!mounted) return;
//         setSummary(data);
//       })
//       .catch((err) => {
//         if (!mounted) return;
//         console.error("Summary fetch failed:", err);
//         setError("Unable to load progress summary.");
//       })
//       .finally(() => {
//         if (!mounted) return;
//         setLoading(false);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   function weaknessScore(s: TopicStats) {
//     // simple metric: failed/attempts (0..1), higher = weaker
//     if (s.attempts === 0) return 0;
//     return s.failed / s.attempts;
//   }

//   function openRoadmapForTopic(topic: string) {
//     // navigate to roadmap page filtered by topic (you may adjust route)
//     router.push(`/roadmap?topic=${encodeURIComponent(topic)}`);
//   }

//   if (loading) {
//     return (
//       <main className="p-6">
//         <h1 className="text-2xl font-bold mb-4">Progress</h1>
//         <p>Loading summary...</p>
//       </main>
//     );
//   }

//   if (error || !summary) {
//     return (
//       <main className="p-6">
//         <h1 className="text-2xl font-bold mb-4">Progress</h1>
//         <p className="text-red-500">{error ?? "No data"}</p>
//       </main>
//     );
//   }

//   // build sorted topics by weakness (desc)
//   const topics = Object.keys(summary.topicStats).map((t) => ({
//     topic: t,
//     stats: summary.topicStats[t],
//     score: weaknessScore(summary.topicStats[t]),
//   }));
//   topics.sort((a, b) => b.score - a.score);

//   return (
//     <main className="p-6">
//       <header className="mb-6">
//         <h1 className="text-3xl font-bold">Your Progress</h1>
//         <p className="text-sm text-muted-foreground">
//           Overview of your solved problems, attempts, and weak topics.
//         </p>
//       </header>

//       <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//         <div className="p-4 rounded bg-slate-900">
//           <h3 className="text-lg font-semibold">Total Solved</h3>
//           <div className="text-2xl mt-2">{summary.totalSolved}</div>
//         </div>

//         <div className="p-4 rounded bg-slate-900">
//           <h3 className="text-lg font-semibold">Total Attempts</h3>
//           <div className="text-2xl mt-2">{summary.totalAttempts}</div>
//         </div>

//         <div className="p-4 rounded bg-slate-900">
//           <h3 className="text-lg font-semibold">Failed Attempts</h3>
//           <div className="text-2xl mt-2">{summary.failedAttempts}</div>
//         </div>
//       </section>

//       <section className="mb-6">
//         <h2 className="text-2xl font-bold mb-3">Topic Breakdown</h2>

//         <div className="space-y-3">
//           {topics.map((t) => (
//             <div
//               key={t.topic}
//               className="flex items-center justify-between p-3 rounded bg-slate-800"
//             >
//               <div>
//                 <div className="font-semibold">{t.topic}</div>
//                 <div className="text-sm text-gray-300">
//                   solved: {t.stats.solved} &nbsp; • &nbsp; attempts:{" "}
//                   {t.stats.attempts} &nbsp; • &nbsp; failed: {t.stats.failed}
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className="text-sm text-gray-300 mr-2">
//                   weakness: {(t.score * 100).toFixed(0)}%
//                 </div>
//                 <button
//                   onClick={() => openRoadmapForTopic(t.topic)}
//                   className="px-3 py-1 bg-indigo-600 rounded text-white text-sm"
//                 >
//                   Practice (roadmap)
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       <section>
//         <h2 className="text-2xl font-bold mb-3">Difficulty Breakdown</h2>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//           {(["easy", "medium", "hard"] as const).map((d) => {
//             const s = summary.difficultyStats[d];
//             return (
//               <div key={d} className="p-3 rounded bg-slate-800 text-sm">
//                 <div className="font-semibold capitalize">{d}</div>
//                 <div className="text-gray-300 mt-1">
//                   solved: {s.solved} <br />
//                   attempts: {s.attempts} <br />
//                   failed: {s.failed}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     </main>
//   );
// }


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

type RoadmapProblem = {
  problemId: string;
  title: string;
  slug?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  examples?: Array<{ input: string; output: string }>;
};

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);

  // map topic -> recommended list
  const [recommendations, setRecommendations] = React.useState<
    Record<string, RoadmapProblem[]>
  >({});

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch("/api/progress/summary")
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "Bad response");
          throw new Error(txt || "Fetch error");
        }
        return (await res.json()) as SummaryResponse;
      })
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Summary fetch failed:", err);
        setError("Unable to load progress summary.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // when we have summary, fetch roadmap recommendations for top topics (top 5 by weakness)
  React.useEffect(() => {
    if (!summary) return;
    const topics = Object.keys(summary.topicStats);
    if (topics.length === 0) return;

    // compute weakness score and sort
    const scored = topics
      .map((t) => {
        const s = summary.topicStats[t];
        const score = s.attempts === 0 ? 0 : s.failed / s.attempts;
        return { topic: t, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // limit to top 5 topics

    // fetch roadmap for each topic in parallel
    const calls = scored.map((s) =>
      fetch(`/api/roadmap?topic=${encodeURIComponent(s.topic)}`)
        .then(async (r) => {
          if (!r.ok) return [] as RoadmapProblem[];
          return (await r.json()).roadmap as RoadmapProblem[];
        })
        .then((list) => {
          // pick up to 3 problems, prefer easy/medium/hard one each when possible
          const byDiff: Record<string, RoadmapProblem[]> = {
            easy: [],
            medium: [],
            hard: [],
          };
          for (const p of list || []) {
            const d = (p.difficulty || "easy").toLowerCase();
            if (d === "easy") byDiff.easy.push(p);
            else if (d === "medium") byDiff.medium.push(p);
            else byDiff.hard.push(p);
          }

          const picked: RoadmapProblem[] = [];
          if (byDiff.easy.length) picked.push(byDiff.easy[0]);
          if (byDiff.medium.length) picked.push(byDiff.medium[0]);
          if (byDiff.hard.length) picked.push(byDiff.hard[0]);

          // if fewer than 3, fill from any remaining problems
          if (picked.length < 3) {
            const flat = list || [];
            for (const p of flat) {
              if (picked.find((x) => x.problemId === p.problemId)) continue;
              picked.push(p);
              if (picked.length >= 3) break;
            }
          }

          return { topic: s.topic, problems: picked };
        })
        .catch((e) => {
          console.warn("Roadmap fetch failed for", s.topic, e);
          return { topic: s.topic, problems: [] as RoadmapProblem[] };
        })
    );

    Promise.all(calls).then((results) => {
      const map: Record<string, RoadmapProblem[]> = {};
      for (const r of results) {
        map[r.topic] = r.problems;
      }
      setRecommendations(map);
    });
  }, [summary]);

  function openRoadmapForTopic(topic: string) {
    router.push(`/roadmap?topic=${encodeURIComponent(topic)}`);
  }

  function openSolveProblem(problemId: string) {
    // open solve page with problemId param (adjust route if your app expects different param)
    router.push(`/solve?problemId=${encodeURIComponent(problemId)}`);
  }

  function weaknessScore(s: TopicStats) {
    if (s.attempts === 0) return 0;
    return s.failed / s.attempts;
  }

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Progress</h1>
        <p>Loading summary...</p>
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
    score: weaknessScore(summary.topicStats[t]),
  }));
  topics.sort((a, b) => b.score - a.score);

  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Your Progress</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your solved problems, attempts, and weak topics.
        </p>
      </header>

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

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3">Topic Breakdown</h2>

        <div className="space-y-3">
          {topics.map((t) => {
            const recs = recommendations[t.topic] || [];
            return (
              <div
                key={t.topic}
                className="p-3 rounded bg-slate-800"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{t.topic}</div>
                    <div className="text-sm text-gray-300">
                      solved: {t.stats.solved} • attempts: {t.stats.attempts} •
                      failed: {t.stats.failed}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      weakness: {(t.score * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => openRoadmapForTopic(t.topic)}
                      className="px-3 py-1 bg-indigo-600 rounded text-white text-sm"
                    >
                      Practice (roadmap)
                    </button>
                  </div>
                </div>

                {/* recommendations */}
                <div className="mt-3">
                  <div className="text-sm text-gray-300 mb-2">
                    Recommended problems:
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {recs.length === 0 && (
                      <div className="text-xs text-gray-500">No recs</div>
                    )}
                    {recs.map((r) => (
                      <button
                        key={r.problemId}
                        onClick={() => openSolveProblem(r.problemId)}
                        className="px-2 py-1 bg-slate-700 rounded text-sm"
                        title={r.title}
                      >
                        {r.title} ({r.difficulty ?? "?"})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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