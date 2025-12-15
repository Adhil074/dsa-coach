"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [weakTopic, setWeakTopic] = useState<string | null>(null);
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
    <main>
      <header>
        <h1>Start your DSA journey — build interview-ready skills.</h1>
        <p>
          New to DSA?{" "}
          <Link href="/roadmap">
            <span style={{ textDecoration: "underline" }}> Roadmap</span>
          </Link>
        </p>

        <div>
          <Link href="/profile">Profile</Link>{" "}
          <button onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </button>
        </div>
      </header>

      <section>
        <div>
          <Link href="/solve">Solve Problems</Link>
        </div>
        <div>
          <Link href="/solved">Solved Problems</Link>
        </div>
        <div>
          <Link href="/progress">Progress</Link>
        </div>
        <div>
          <Link href="/mock-interview">Mock Interview</Link>
        </div>
      </section>

      <footer>
        <div>You solved {weeklySolved ?? 0} problems this week.</div>
      </footer>
    </main>
  );
}
