"use client";
import { useState } from "react"; //stores credentials
import { useRouter } from "next/navigation"; //redirects user to dashboard after login
import { signIn } from "next-auth/react"; //sends credentials to nextauth to check user

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
    <div className="w-full max-w-md bg-slate-900 border border-zinc-800 rounded-xl p-6">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Log in to DSA Coach
      </h1>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsLoading(true);

          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          setIsLoading(false);

          if (result?.error) {
            setError("Invalid email or password");
          } else {
            router.push("/dashboard");
          }
        }}
      >
        <div>
          <label className="block text-sm mb-1 text-zinc-400">
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-400">
            Password
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  </div>
);
}

