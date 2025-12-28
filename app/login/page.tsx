"use client";
import { useState } from "react"; //stores credentials
import { useRouter } from "next/navigation"; //redirects user to dashboard after login
import { signIn } from "next-auth/react"; //sends credentials to nextauth to check user

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-zinc-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Log in to DSA Nexus
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
            <label className="block text-sm mb-1 text-zinc-400">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

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
