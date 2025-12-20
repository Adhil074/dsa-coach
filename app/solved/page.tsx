"use client";

import { useEffect, useState } from "react";


import { useRouter } from "next/navigation";

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
  const router=useRouter();

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {" "}
      <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-1.5 bg-slate-800 text-sm hover:bg-slate-700 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      <h1 className="text-3xl font-bold mb-6">Solved Problems</h1>
      {items.length === 0 && (
        <p className="text-slate-400">No problems solved yet.</p>
      )}
      <ul className="mt-6 space-y-4">
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
            <li
              key={key}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <strong className="text-lg block mb-2">
                {item.title ?? "Untitled problem"}
              </strong>

              <div className="text-slate-300 text-sm">
                Topic:{" "}
                <span className="text-slate-200">{item.topic ?? "—"}</span>
              </div>
              <div className="text-slate-300 text-sm">
                Difficulty:{" "}
                <span className="text-slate-200">{item.difficulty ?? "—"}</span>
              </div>
              <div className="text-slate-400 text-sm mt-1">
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
