import Link from "next/link";

export default function WelcomePage() {
  return (
    <main>
      <h1>Welcome to DSA Coach</h1>
      <p>Choose an option to continue:</p>

      <div>
        <Link href="/signup">
          <button>Sign up</button>
        </Link>

        <Link href="/login">
          <button>Sign in</button>
        </Link>
      </div>
    </main>
  );
}