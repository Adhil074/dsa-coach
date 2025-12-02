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
    <div>
      <h1>Log in</h1>
      <form
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

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

