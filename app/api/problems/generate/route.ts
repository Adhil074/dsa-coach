import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Problem } from "../../../../../lib/models/problem";
import { Types } from "mongoose";

interface GenerateRequest {
  topic?: string;
  difficulty?: string;
  language?: string;
  useOpenAI?: boolean;
}

interface GeneratedProblem {
  id: string;
  title: string;
  description: string;
  examples: Array<{ input: string; output: string }>;
  constraints?: string;
  hiddenTestsCount?: number;
  visibleTestsCount?: number;
}

function mockProblem(
  topic: string = "arrays",
  difficulty: string = "easy"
): GeneratedProblem {
  return {
    id: `${topic}-${difficulty}-001`,
    title: `Sum of Two Numbers (${difficulty})`,
    description:
      "Given an array of integers nums and a target integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints:
      "2 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9",
    hiddenTestsCount: 2,
    visibleTestsCount: 2,
  };
}

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json().catch(() => ({}));

    const topic = (body.topic || "arrays").toLowerCase();
    const difficulty = (body.difficulty || "easy").toLowerCase();

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Generate problem (mock or AI)
    let generatedProblem: GeneratedProblem;

    const useGemini = !!body.useOpenAI && !!process.env.GOOGLE_API_KEY;

    if (useGemini) {
      generatedProblem = await generateWithGemini(topic, difficulty);
    } else {
      generatedProblem = mockProblem(topic, difficulty);
    }

    // Create unique slug
    const slug = `${topic}-${difficulty}-${Date.now()}`.toLowerCase();

    // Save to MongoDB
    const savedProblem = await Problem.create({
      title: generatedProblem.title,
      slug,
      description: generatedProblem.description,
      topic: topic as
        | "arrays"
        | "strings"
        | "hashmaps"
        | "linkedlists"
        | "trees",
      difficulty: difficulty as "easy" | "medium" | "hard",
      examples: generatedProblem.examples || [],
      testCases: (generatedProblem.examples || []).map((ex) => ({
        input: ex.input,
        output: ex.output,
        isHidden: false,
      })),
      supportedLanguages: ["javascript", "python", "java", "cpp"],
      generatedByAI: useGemini,
    });

    // Return with real MongoDB ID
    return NextResponse.json({
      problem: {
        id: String(savedProblem._id), // Return ObjectId as string
        title: savedProblem.title,
        description: savedProblem.description,
        examples: savedProblem.examples,
        constraints: generatedProblem.constraints,
        visibleTestsCount: generatedProblem.visibleTestsCount || 2,
        hiddenTestsCount: generatedProblem.hiddenTestsCount || 2,
      },
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

async function generateWithGemini(
  topic: string,
  difficulty: string
): Promise<GeneratedProblem> {
  const prompt = `Generate one ${difficulty} DSA problem focused on ${topic}.
Return ONLY a valid JSON object (no extra text) with these keys:
{
  "title": "problem title",
  "description": "detailed description",
  "examples": [{"input": "example input", "output": "expected output"}],
  "constraints": "constraints string",
  "visibleTestsCount": 2,
  "hiddenTestsCount": 2
}`;

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = "gemini-2.0-flash";

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey as string)}`,
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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!resp.ok) {
      console.warn("Gemini API failed, using mock");
      return mockProblem(topic, difficulty);
    }

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/{[sS]*}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: `${topic}-${difficulty}-gemini`,
        ...parsed,
      };
    }

    return mockProblem(topic, difficulty);
  } catch (err) {
    console.warn("Gemini generation failed:", err);
    return mockProblem(topic, difficulty);
  }
}