import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ITestCase {
  input: string; // plain string input (we'll parse in JS runner)
  output: string; // expected output as stringified value
  isHidden?: boolean;
}

export interface IProblem extends Document {
  title: string;
  slug: string;
  description: string;
  // include all topic variants we use across the app
  topic:
    | "arrays"
    | "strings"
    | "hashmaps"
    | "linked-list"
    | "linkedlists"
    | "trees"
    | "graphs"
    | "dp"
    | "stack-queue";
  difficulty: "easy" | "medium" | "hard";
  optimalTime: string;
  optimalSpace: string;
  examples: IExample[];
  testCases: ITestCase[];
  constraints:string[];
  supportedLanguages: string[];
  generatedByAI: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExampleSchema = new Schema<IExample>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const TestCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: false }, // visible by default for seeded tests
  },
  { _id: false }
);

const ProblemSchema: Schema<IProblem> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      enum: [
        "arrays",
        "strings",
        "hashmaps",
        "linked-list",
        "linkedlists",
        "trees",
        "graphs",
        "dp",
        "stack-queue",
      ],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    optimalTime: {
      type: String,
      enum: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)"],
      default: null,
    },
    optimalSpace: {
      type: String,
      enum: ["O(1)", "O(n)"],
      default: null,
    },
    examples: {
      type: [ExampleSchema],
      default: [],
    },
    testCases: {
      type: [TestCaseSchema],
      default: [],
    },
    supportedLanguages: {
      type: [String],
      default: ["javascript", "python", "java", "cpp"],
    },
    generatedByAI: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Problem: Model<IProblem> =
  mongoose.models.Problem || mongoose.model<IProblem>("Problem", ProblemSchema);
