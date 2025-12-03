"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; //redirects
import { useSession } from "next-auth/react"; //tells if user logged in or out

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <div>Dashboard (protected) - Welcome {session.user?.email}</div>;
}
