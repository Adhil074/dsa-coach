
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatRequest = {
  message: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ reply: "No message provided" });
    }

    // Abort if HF is slow
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const res = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: body.message,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    clearTimeout(timeout);

    const data = await res.json();

    let reply = "No response from AI";

    //  Handle ALL HuggingFace response shapes
    if (Array.isArray(data) && data.length > 0) {
      reply = data[0]?.generated_text || reply;
    } else if (data?.generated_text) {
      reply = data.generated_text;
    } else if (data?.error) {
      reply = "AI is busy. Try again in few seconds.";
    }

    //  Remove prompt echo if model repeats input
    if (reply.startsWith(body.message)) {
      reply = reply.slice(body.message.length).trim();
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { reply: "AI took too long. Try again." },
        { status: 504 }
      );
    }

    console.error("HF AI error:", err);
    return NextResponse.json(
      { reply: "AI failed. Try again later." },
      { status: 500 }
    );
  }
}