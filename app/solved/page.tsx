"use client";

import { useEffect, useState } from "react";

type SolvedItem = {
  // some fields may come as _id or problemId depending on server mapping
  progressId?: string | null;
  _id?: string | null;
  problemId?: string | null;
  title?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  solvedAt?: number | string | null;
};

export default function SolvedPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SolvedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSolved() {
      try {
        const res = await fetch("/api/progress/solved");
        if (!res.ok) {
          setError("Failed to load solved problems");
          setLoading(false);
          return;
        }

        const data = await res.json();
        // ensure array
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        setError("Something went wrong");
        setLoading(false);
      }
    }

    loadSolved();
  }, []);

  if (loading) return <p>Loading solved problems...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Solved Problems</h1>

      {items.length === 0 && <p>No problems solved yet.</p>}

      <ul style={{ marginTop: "20px", listStyle: "none", padding: 0 }}>
        {items.map((item, idx) => {
          // Choose the most stable unique key available:
          const key =
            item.progressId ||
            item._id ||
            item.problemId ||
            (item.title
              ? `${item.title}-${String(item.solvedAt ?? "")}`
              : `solved-${idx}`);

          // Normalize solvedAt to a number or null
          const solvedAtNum =
            item.solvedAt == null
              ? null
              : Number(new Date(item.solvedAt).getTime());

          return (
            <li key={key} style={{ marginBottom: "16px" }}>
              <strong>{item.title ?? "Untitled problem"}</strong>
              <br />
              <div>Topic: {item.topic ?? "—"}</div>
              <div>Difficulty: {item.difficulty ?? "—"}</div>
              <div>
                Solved At:{" "}
                {solvedAtNum
                  ? new Date(solvedAtNum).toLocaleString()
                  : "Unknown"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
