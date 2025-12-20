import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md space-y-4 text-center">
      <h1 className="text-3xl font-bold">Welcome to DSA Coach</h1>
      <p className="text-gray-400">
          Practice DSA smartly. Track progress. Improve faster.
        </p>
      <p>Choose an option to continue:</p>

      <div className="flex gap-4 justify-center">
        <Link href="/signup">
          <button className="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-700">Sign up</button>
        </Link>

        <Link href="/login">
          <button className="px-6 py-2 rounded border border-gray-600 hover:bg-gray-800">Sign in</button>
        </Link>
      </div>
      </div>
    </main>
  );
}