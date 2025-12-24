import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body: { title: string; topics: string[] } = await req.json();

  
  const text = `
This phase focuses on ${body.title}.
You will build intuition around ${body.topics.join(", ")}.
These skills are foundational and frequently tested in interviews.
Completing this phase prepares you for more complex patterns ahead.
  `.trim();

  return NextResponse.json({ text });
}