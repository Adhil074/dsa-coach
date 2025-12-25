// dsa-coach/store/useProblemStore.ts
import { create } from "zustand";

//types

type Example = {
  input: string;
  output: string;
};

type Problem = {
  id: string;
  title: string;
  description: string;
  examples: Example[];
  constraints?: string;

  // ✅ REQUIRED for evaluation
  optimalTime?: string | null;
  optimalSpace?: string | null;

  visibleTestsCount?: number;
  hiddenTestsCount?: number;
};

type SubmissionResult = {
  isCorrect?: boolean;
  isOptimal?: boolean;
  feedback?: string;
  improvements?: string;
};

/* ---------- Store Type ---------- */

type ProblemStore = {
  // generation
  topic: string;
  difficulty: string;
  language: string;
  problem: Problem | null;
  isGenerating: boolean;
  genError: string | null;

  // submission
  code: string;
  isSubmitting: boolean;
  submissionResult: SubmissionResult | null;
  submitError: string | null;

  // setters
  setTopic: (v: string) => void;
  setDifficulty: (v: string) => void;
  setLanguage: (v: string) => void;
  setProblem: (v: Problem | null) => void;
  setIsGenerating: (v: boolean) => void;
  setGenError: (v: string | null) => void;
  setCode: (v: string) => void;
  setIsSubmitting: (v: boolean) => void;
  setSubmissionResult: (v: SubmissionResult | null) => void;
  setSubmitError: (v: string | null) => void;

  // resets
  resetProblem: () => void;
  resetSubmission: () => void;
  resetAll: () => void;
};

/* ---------- Initial State ---------- */

const initialState = {
  topic: "",
  difficulty: "",
  language: "",
  problem: null,
  isGenerating: false,
  genError: null,
  code: "",
  isSubmitting: false,
  submissionResult: null,
  submitError: null,
};

/* ---------- Store ---------- */

export const useProblemStore = create<ProblemStore>((set) => ({
  ...initialState,

  // setters
  setTopic: (topic) => set({ topic }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setLanguage: (language) => set({ language }),
  setProblem: (problem) => set({ problem }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenError: (genError) => set({ genError }),
  setCode: (code) => set({ code }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmissionResult: (submissionResult) => set({ submissionResult }),
  setSubmitError: (submitError) => set({ submitError }),

  // resets
  resetProblem: () =>
    set({
      problem: null,
      genError: null,
      isGenerating: false,
    }),

  resetSubmission: () =>
    set({
      code: "",
      submissionResult: null,
      submitError: null,
      isSubmitting: false,
    }),

  resetAll: () => set({ ...initialState }),
}));
