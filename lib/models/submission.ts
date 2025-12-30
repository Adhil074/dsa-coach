import { Schema, model, models, Types } from "mongoose";

const SubmissionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true },
    problemId: { type: Types.ObjectId, required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    verdict: {
      type: String,
      enum: ["correct_optimal", "correct_suboptimal", "incorrect"],
      required: true,
    },
    solved: { type: Boolean, default: false }, // Helper field for quick queries
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient queries
SubmissionSchema.index({ userId: 1, createdAt: -1 });
SubmissionSchema.index({ problemId: 1, userId: 1 });

export const Submission =
  models.Submission || model("Submission", SubmissionSchema);
