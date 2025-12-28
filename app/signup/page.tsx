"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; //lets redirect to login after signup

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword,setShowPassword]=useState(false);
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
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-indigo-500 transition"
            />

            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                /* Eye off */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-5-9-5a17.67 17.67 0 014.288-4.768M21 21l-6-6"
                  />
                </svg>
              ) : (
                /* Eye */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.163.512-.37 1.014-.62 1.497"
                  />
                </svg>
              )}
            </button>
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
