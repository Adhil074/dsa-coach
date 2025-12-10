import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/db";
import { Problem } from "../../../../../lib/models/problem";

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

/**
 * Small generic mock generator used only as the last fallback.
 * This no longer returns the two-sum static content for all topics.
 */
function mockProblem(topic = "arrays", difficulty = "easy"): GeneratedProblem {
  const title = `${capitalize(topic)} Example Problem (${difficulty})`;
  return {
    id: `${topic}-${difficulty}-mock-${Date.now()}`,
    title,
    description: `This is a placeholder ${difficulty} problem about ${topic}. Replace with a real problem or enable AI generation.`,
    examples: [
      { input: "example input 1", output: "example output 1" },
      { input: "example input 2", output: "example output 2" },
    ],
    constraints: "No constraints (placeholder).",
    hiddenTestsCount: 2,
    visibleTestsCount: 2,
  };
}

function capitalize(s: string) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json().catch(() => ({}));

    // Normalize topic/difficulty
    const rawTopic = (body.topic || "arrays").toLowerCase().trim();
    const rawDifficulty = (body.difficulty || "easy").toLowerCase().trim();

    const difficulty = ["easy", "medium", "hard"].includes(rawDifficulty)
      ? rawDifficulty
      : "easy";

    // map common variants to the canonical topic stored in DB
    const topicMap: Record<string, string> = {
      arrays: "arrays",
      array: "arrays",
      strings: "strings",
      string: "strings",
      "linked-list": "linked-list",
      linkedlist: "linked-list",
      linkedlists: "linked-list",
      "linked-lists": "linked-list",
      graphs: "graphs",
      graph: "graphs",
      trees: "trees",
      tree: "trees",
      dp: "dp",
      "dynamic-programming": "dp",
      hashmaps: "hashmaps",
      "stack-queue": "stack-queue",
      stackqueue: "stack-queue",
      stack: "stack-queue",
      queue: "stack-queue",
    };

    const topic = topicMap[rawTopic] ?? rawTopic;

    await connectToDatabase();

    // Try to select a random problem from DB that matches topic + difficulty
    let generatedProblem: GeneratedProblem | null = null;

    // First: try strict match (topic + difficulty) and random sample
    try {
      const aggStrict = await Problem.aggregate([
        { $match: { topic: topic, difficulty: difficulty } },
        { $sample: { size: 1 } },
      ]).allowDiskUse(true);

      if (Array.isArray(aggStrict) && aggStrict.length > 0) {
        const doc = aggStrict[0];
        generatedProblem = docToGeneratedProblem(doc);
      }
    } catch (e) {
      console.warn("Aggregation strict match failed:", e);
    }

    // Second: if strict didn't return anything, try match by topic only (random)
    if (!generatedProblem) {
      try {
        const aggTopic = await Problem.aggregate([
          { $match: { topic: topic } },
          { $sample: { size: 1 } },
        ]).allowDiskUse(true);

        if (Array.isArray(aggTopic) && aggTopic.length > 0) {
          generatedProblem = docToGeneratedProblem(aggTopic[0]);
        }
      } catch (e) {
        console.warn("Aggregation topic match failed:", e);
      }
    }

    // Third: if nothing found in DB, optionally use Gemini (if configured)
    const useGemini = !!body.useOpenAI && !!process.env.GOOGLE_API_KEY;
    if (!generatedProblem && useGemini) {
      generatedProblem = await generateWithGemini(topic, difficulty);
    }

    // Final fallback: generic mock
    if (!generatedProblem) {
      generatedProblem = mockProblem(topic, difficulty);
    }

    // Save to MongoDB (so UI receives a real _id and examples/constraints)
    // If the generatedProblem came from DB originally, it already has an _id in DB.
    // But when it came from Gemini/mock we need to insert a new document.
    let savedProblem;
    if (
      generatedProblem &&
      generatedProblem.id &&
      generatedProblem.id.startsWith("dbdoc-")
    ) {
      // This branch won't usually run; kept for compatibility if you later
      // add special id markers. For now we just create normally.
    }

    // Create slug and insert if not already in DB (if it was from DB we used that doc)
    // Attempt to find an existing problem with identical title+topic+difficulty to avoid duplicates
    const existing = await Problem.findOne({
      title: generatedProblem.title,
      topic,
      difficulty,
    }).lean();

    if (existing) {
      savedProblem = existing;
    } else {
      const slug = `${topic}-${difficulty}-${Date.now()}`.toLowerCase();
      savedProblem = await Problem.create({
        title: generatedProblem.title,
        slug,
        description: generatedProblem.description,
        topic,
        difficulty,
        examples: generatedProblem.examples || [],
        // We intentionally don't create full testCases here (skip heavy testcases)
        testCases: (generatedProblem.examples || []).map((ex) => ({
          input: ex.input,
          output: ex.output,
          isHidden: false,
        })),
        supportedLanguages: ["javascript", "python", "java", "cpp"],
        generatedByAI: useGemini,
      });
    }

    return NextResponse.json({
      problem: {
        id: String(savedProblem._id),
        title: savedProblem.title,
        description: savedProblem.description,
        examples: savedProblem.examples,
        constraints: generatedProblem.constraints,
        visibleTestsCount: generatedProblem.visibleTestsCount ?? 2,
        hiddenTestsCount: generatedProblem.hiddenTestsCount ?? 2,
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

/** Convert a DB doc (mongoose) to our GeneratedProblem shape */
function docToGeneratedProblem(doc: any): GeneratedProblem {
  return {
    id: String(doc._id),
    title: doc.title ?? `Untitled (${doc.topic ?? "unknown"})`,
    description: doc.description ?? "",
    examples: Array.isArray(doc.examples) ? doc.examples : [],
    constraints: doc.constraints ?? undefined,
    hiddenTestsCount: doc.hiddenTestsCount ?? 2,
    visibleTestsCount: doc.visibleTestsCount ?? 2,
  };
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response and parse safely
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: `${topic}-${difficulty}-gemini-${Date.now()}`,
          ...parsed,
        };
      } catch (e) {
        console.warn("Gemini JSON parse failed, fallback to mock", e);
        return mockProblem(topic, difficulty);
      }
    }

    return mockProblem(topic, difficulty);
  } catch (err) {
    console.warn("Gemini generation failed:", err);
    return mockProblem(topic, difficulty);
  }
}
