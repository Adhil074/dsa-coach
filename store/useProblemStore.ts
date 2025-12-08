import { create } from 'zustand';

// Types
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
  visibleTestsCount?: number;
  hiddenTestsCount?: number;
};

type SubmissionResult = {
  passed?: number;
  total?: number;
  time?: string;
  space?: string;
  analysis?: string;
  lineFeedback?: string[];
};

// Store State Type
type ProblemStore = {
  // Problem generation state
  topic: string;
  difficulty: string;
  language: string;
  problem: Problem | null;
  isGenerating: boolean;
  genError: string | null;

  // Code submission state
  code: string;
  isSubmitting: boolean;
  submissionResult: SubmissionResult | null;
  submitError: string | null;

  // Actions to update state
  setTopic: (topic: string) => void;
  setDifficulty: (difficulty: string) => void;
  setLanguage: (language: string) => void;
  setProblem: (problem: Problem | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenError: (error: string | null) => void;
  setCode: (code: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSubmissionResult: (result: SubmissionResult | null) => void;
  setSubmitError: (error: string | null) => void;

  // Reset functions
  resetProblem: () => void;
  resetSubmission: () => void;
  resetAll: () => void;
};

// Initial state
const initialState = {
  topic: 'arrays',
  difficulty: 'easy',
  language: 'javascript',
  problem: null,
  isGenerating: false,
  genError: null,
  code: '',
  isSubmitting: false,
  submissionResult: null,
  submitError: null,
};

// Create store
export const useProblemStore = create<ProblemStore>((set) => ({
  ...initialState,

  // Setters
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

  // Reset functions
  resetProblem: () =>
    set({
      problem: null,
      genError: null,
      isGenerating: false,
    }),

  resetSubmission: () =>
    set({
      code: '',
      submissionResult: null,
      submitError: null,
      isSubmitting: false,
    }),

  resetAll: () => set(initialState),
}));