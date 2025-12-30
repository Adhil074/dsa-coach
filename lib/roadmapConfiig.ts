export type UnlockRule = null | {
  requiredPhaseId: string;
};

export type RoadmapPhase = {
  id: string;
  title: string;
  order: number;
  difficulties: string[];

  topics: string[];

  unlockRule: UnlockRule;

  description: string;
};

export const ROADMAP: RoadmapPhase[] = [
  {
    id: "phase-1",
    title: "Phase 1: Foundations",
    order: 1,
    topics: ["arrays", "strings"],
    unlockRule: null, // always unlocked
    difficulties: ["easy", "medium"],
    description:
      "Learn basic arrays and strings. Focus on loops, indexing, and simple patterns. This phase builds brute-force thinking.",
  },

  {
    id: "phase-2",
    title: "Phase 2: Core Patterns",
    order: 2,
    topics: ["arrays", "strings", "linked-list"],
    unlockRule: { requiredPhaseId: "phase-1" },
    difficulties: ["hard", "easy"],
    description:
      "Strengthen logic with harder array and string problems and start linked lists. Focus on sliding window, hashing, and pointer techniques.",
  },

  {
    id: "phase-3",
    title: "Phase 3: Intermediate DSA",
    order: 3,
    topics: ["linked-list", "graphs"],
    difficulties: ["medium", "hard", "easy"],
    unlockRule: { requiredPhaseId: "phase-2" },
    description:
      "Handle complex linked list problems and begin graph traversal. Learn BFS, DFS, and traversal-based thinking.",
  },

  {
    id: "phase-4",
    title: "Phase 4: Advanced Patterns",
    order: 4,
    topics: ["graphs", "dp"],
    difficulties: ["hard", "medium", "easy"],
    unlockRule: { requiredPhaseId: "phase-3" },
    description:
      "Master graph-heavy problems and dynamic programming. Learn state transitions, memoization, and optimization techniques.",
  },

  {
    id: "phase-5",
    title: "Phase 5: Interview Level",
    order: 5,
    topics: ["arrays", "strings", "linked-list", "graphs", "dp"],
    difficulties: ["easy", "medium", "hard"],
    unlockRule: { requiredPhaseId: "phase-4" },
    description:
      "Mixed interview-level problems combining all topics. Focus on speed, accuracy, and pattern recall under pressure.",
  },
];
