import mongoose, { Schema, Document, Model, Types } from "mongoose";
export interface IProgress extends Document {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  status: "attempted" | "solved" | "failed";
  language: string;
  submissionCount: number;
  solvedCount?: number;
  failedAttempts: number;
  lastCode: string;
  title: string;
  difficulty: string;
  aiFeedback?: string;
  topic: "arrays" | "strings" | "hashmaps" | "linkedlists" | "trees";
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema: Schema<IProgress> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    status: {
      type: String,
      enum: ["attempted", "solved", "failed"],
      default: "attempted",
    },
    language: {
      type: String,
      required: true,
      default: "javascript",
    },
    submissionCount: {
      type: Number,
      default: 1,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lastCode: {
      type: String,
      default: "",
    },
    aiFeedback: {
      type: String,
    },
    topic: {
      type: String,
      enum: ["arrays", "strings", "hashmaps", "linkedlists", "trees"],
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    difficulty: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Progress: Model<IProgress> =
  mongoose.models.Progress ||
  mongoose.model<IProgress>("Progress", ProgressSchema);
