"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; //lets redirect to login after signup

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Create your account
        </h1>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);
            setIsLoading(true);

            try {
              const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
              });

              const data = await res.json();

              if (!res.ok) {
                setError(data.message || "Signup failed");
              } else {
                setSuccess("Signup successful, redirecting to login...");
                setName("");
                setEmail("");
                setPassword("");
                window.setTimeout(() => {
                  router.push("/login");
                }, 1500);
              }
            } catch (err) {
              setError("Something went wrong. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm mb-1 text-gray-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-500 bg-green-500/10 p-2 rounded">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 transition rounded-md py-2 font-medium disabled:opacity-50"
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
