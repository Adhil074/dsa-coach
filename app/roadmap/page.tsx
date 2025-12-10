// app/roadmap/page.tsx
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
    <main
      style={{
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "#e6e6e6",
        background: "#0b0b0b",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ margin: 0, marginBottom: 18 }}>Roadmap</h1>

      {loading && <p>Loading roadmap...</p>}
      {error && <p style={{ color: "salmon" }}>Error: {error}</p>}

      {!loading && !error && items.length === 0 && <p>No roadmap items yet.</p>}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: "grid", gap: 18 }}>
          {Array.from(grouped.entries()).map(([topic, list]) => (
            <section
              key={topic}
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                padding: 14,
                borderRadius: 8,
              }}
            >
              <h2 style={{ margin: "0 0 8px 0", textTransform: "capitalize" }}>
                {topic}
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                {list.map((it) => (
                  <article
                    key={it.problemId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 12,
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {it.title ?? "Untitled problem"}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        Topic: {it.topic} • Difficulty: {it.difficulty ?? "—"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openProblem(it.problemId)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "#111",
                          color: "#fff",
                          cursor: "pointer",
                        }}
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
