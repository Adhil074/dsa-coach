"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState<string>("User");
  const [weakTopic, setWeakTopic] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [suggestedProblem, setSuggestedProblem] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [weeklySolved, setWeeklySolved] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.name) {
      setUsername(session.user.name); // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("/api/user/progress-summary");
        if (!res.ok) return;
        const data = await res.json();
        setWeakTopic(data.weakTopics?.[0]?.topic ?? null);
        const rec = data.recommendation ?? data.suggestedProblem ?? null;
        if (rec)
          setSuggestedProblem({
            id: rec.problemId ?? rec.id,
            title: rec.title ?? rec.name,
          });
        setWeeklySolved(data.weeklySolved ?? data.solvedThisWeek ?? null);
      } catch (e) {
        // API may not exist yet — ignore
      }
    })();
  }, [session]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <header className="flex items-center justify-between mb-10">
        <div className="relative mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="ml-2 text-2xl text-slate-100 bg-slate-900 rounded hover:border-indigo-500 shadow-sm border border-r border-slate-800 cursor-pointer px-3 py-1 transition-all"
            aria-label="Open sidebar"
            style={{
              minWidth: "2.5rem",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
            }}
          >
            ⋮
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-red-400"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        {/* Welcome Text - Center */}
        <h2 className="text-2xl font-semibold absolute left-1/2 transform -translate-x-1/2">
          Hello <span className="text-blue-600">{username}</span>
        </h2>
      </header>
      <h1 className="text-4xl font-bold text-center mb-2">
        Start your DSA journey - build interview ready skills.
      </h1>
      <p className="text-slate-400 text-lg text-center mb-8">
        New to DSA?{" "}
        <Link href="/roadmap">
          <span className="underline text-indigo-400 hover:text-indigo-300">
            Roadmap
          </span>
        </Link>
      </p>
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition flex flex-col items-center justify-center text-center">
          <Link href="/solve" className="text-lg font-semibold">
            Solve Problems
          </Link>
          <p className="text-slate-400 text-center text-sm mt-1">
            Practice curated DSA questions
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition flex flex-col items-center justify-center text-center">
          <Link href="/solved" className="text-lg font-semibold">
            Solved Problems
          </Link>
          <p className="text-slate-400 text-sm mt-1">
            Review what you already solved
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition flex flex-col items-center justify-center text-center">
          <Link href="/progress" className="text-lg font-semibold">
            Progress
          </Link>
          <p className="text-slate-400 text-sm mt-1">
            Track your learning streak
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition flex flex-col items-center justify-center text-center">
          <Link href="/ai" className="text-lg font-semibold">
            AI Assistant
          </Link>
          <p className="text-slate-400 text-sm mt-1">
            Get help with concepts & solutions
          </p>
        </div>
      </section>
    </main>
  );
}