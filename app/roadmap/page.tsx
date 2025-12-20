"use client";

import React, { JSX } from "react";
import { useRouter } from "next/navigation";

type RoadmapItem = {
  problemId: string;
  title?: string | null;
  slug?: string | null;
  topic: string;
  difficulty?: "easy" | "medium" | "hard" | string | null;
};

type RoadmapResponse =
  | {
      roadmap?: RoadmapItem[];
    }
  | RoadmapItem[]; // support both shapes: { roadmap: [...] } or just [...]

function normalizeResponse(json: RoadmapResponse): RoadmapItem[] {
  if (Array.isArray(json)) return json;
  return json.roadmap ?? [];
}

function groupByTopic(items: RoadmapItem[]) {
  const map = new Map<string, RoadmapItem[]>();
  for (const it of items) {
    const topic = it.topic || "misc";
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic)!.push(it);
  }
  return map;
}

export default function RoadmapPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = React.useState<RoadmapItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/roadmap");
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const json = await res.json();
        const normalized = normalizeResponse(json);
        if (!cancelled) setItems(normalized);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = React.useMemo(() => groupByTopic(items), [items]);

  function openProblem(problemId: string) {
    // navigate to solve page with problemId (solve page should handle query param)
    router.push(`/solve?problemId=${encodeURIComponent(problemId)}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {" "}
      <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => router.push("/dashboard")}
        className="px-3 py-1.5 bg-slate-800 text-sm hover:bg-slate-700 rounded-lg transition-colors"
      >
        ← Back
      </button>
      </div>
      <h1 className="text-2xl font-semibold mb-6">Roadmap</h1>
      {loading && <p className="text-slate-400">Loading roadmap...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-slate-400">No roadmap items yet.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-5">
          {Array.from(grouped.entries()).map(([topic, list]) => (
            <section
              key={topic}
              className="border border-slate-800 rounded-xl p-4"
            >
              <h2 className="text-xl font-semibold mb-3 capitalize">{topic}</h2>

              <div className="grid gap-3">
                {list.map((it) => (
                  <article
                    key={it.problemId}
                    className="flex justify-between items-center bg-slate-900 rounded-lg p-4"
                  >
                    <div>
                      <div className="font-bold">
                        {it.title ?? "Untitled problem"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Topic: {it.topic} • Difficulty: {it.difficulty ?? "—"}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openProblem(it.problemId)}
                        className="px-3 py-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700"
                      >
                        Open
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
