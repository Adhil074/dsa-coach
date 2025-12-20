
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // 🔥 Single strong system prompt for DSA Coach
    let systemPrompt = `
You are an expert DSA coach for coding interviews.

Your job:
- Teach Data Structures & Algorithms clearly
- Explain concepts step-by-step in simple language
- Analyze time & space complexity
- Give optimized approaches
- Help users improve suboptimal solutions
- Provide hints instead of direct answers when possible
- Be interview-focused and practical

User question:
${message}
`;

    // Preserve conversation context (unchanged logic)
    if (context && context.length > 0) {
      const contextStr = context
        .map(
          (msg: { role: string; content: string }) =>
            `${msg.role}: ${msg.content}`
        )
        .join("\n");

      systemPrompt = `Previous conversation:
${contextStr}

${systemPrompt}`;
    }

    // Gemini API call (unchanged)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error("Failed to get response from Gemini");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      response: text,
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}