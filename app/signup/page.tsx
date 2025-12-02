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
    <div>
      <h1>Sign up</h1>

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
      >
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p>{error}</p>}
        {success && <p>{success}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}
