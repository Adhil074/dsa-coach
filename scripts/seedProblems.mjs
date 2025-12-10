// scripts/seedProblems.mjs
import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Set MONGODB_URI before running.");
  process.exit(1);
}

//
// REAL EXAMPLES + CONSTRAINTS FOR ALL 15 PROBLEMS
//

const seedList = [
  // ARRAYS
  {
    title: "Sum of Two Numbers",
    topic: "arrays",
    difficulty: "easy",
    description:
      "Given an array nums and a target integer target, return the indices of the two numbers such that they add up to target.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9",
  },
  {
    title: "Subarray with Given Sum",
    topic: "arrays",
    difficulty: "medium",
    description:
      "Find a contiguous subarray that sums to target and return its start and end indices.",
    examples: [
      { input: "nums = [1,4,20,3,10,5], target = 33", output: "[2,4]" },
      { input: "nums = [10,2,-2,-20,10], target = -10", output: "[0,3]" },
    ],
    constraints: "1 <= nums.length <= 10^5",
  },
  {
    title: "Largest Subarray Product",
    topic: "arrays",
    difficulty: "hard",
    description:
      "Find the contiguous subarray with the largest product and return the product.",
    examples: [
      { input: "nums = [2,3,-2,4]", output: "6" },
      { input: "nums = [-2,0,-1]", output: "0" },
    ],
    constraints: "1 <= nums.length <= 2 * 10^4",
  },

  // STRINGS
  {
    title: "Reverse a String",
    topic: "strings",
    difficulty: "easy",
    description: "Reverse the characters in a string.",
    examples: [
      { input: `"hello"`, output: `"olleh"` },
      { input: `"ads"`, output: `"sda"` },
    ],
    constraints: "1 <= s.length <= 10^5",
  },
  {
    title: "Longest Substring Without Repeating",
    topic: "strings",
    difficulty: "medium",
    description:
      "Find the length of the longest substring without repeating characters.",
    examples: [
      { input: `"abcabcbb"`, output: "3" },
      { input: `"bbbbb"`, output: "1" },
    ],
    constraints: "1 <= s.length <= 5 * 10^4",
  },
  {
    title: "Regular Expression Matching",
    topic: "strings",
    difficulty: "hard",
    description:
      "Implement regex matching with '.' and '*' where '.' matches any char and '*' means zero or more of previous element.",
    examples: [
      { input: `s = "aa", p = "a*"`, output: "true" },
      { input: `s = "ab", p = ".*"`, output: "true" },
    ],
    constraints: "1 <= s.length, p.length <= 20",
  },

  // LINKED LIST
  {
    title: "Reverse Linked List",
    topic: "linked-list",
    difficulty: "easy",
    description: "Reverse a singly linked list.",
    examples: [
      { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "[1,2]", output: "[2,1]" },
    ],
    constraints: "0 <= nodes <= 5000",
  },
  {
    title: "Detect Cycle in Linked List",
    topic: "linked-list",
    difficulty: "medium",
    description: "Return true if the linked list contains a cycle.",
    examples: [
      { input: "[3,2,0,-4], pos=1", output: "true" },
      { input: "[1], pos=-1", output: "false" },
    ],
    constraints: "0 <= nodes <= 10^4",
  },
  {
    title: "Merge K Sorted Lists",
    topic: "linked-list",
    difficulty: "hard",
    description: "Merge k sorted linked lists and return one sorted list.",
    examples: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" },
      { input: "[]", output: "[]" },
    ],
    constraints: "0 <= k <= 10^4",
  },

  // DP
  {
    title: "Climbing Stairs",
    topic: "dp",
    difficulty: "easy",
    description:
      "You can climb 1 or 2 steps. Count distinct ways to reach step n.",
    examples: [
      { input: "n = 2", output: "2" },
      { input: "n = 3", output: "3" },
    ],
    constraints: "1 <= n <= 45",
  },
  {
    title: "House Robber",
    topic: "dp",
    difficulty: "medium",
    description: "Max money you can rob without robbing adjacent houses.",
    examples: [
      { input: "[1,2,3,1]", output: "4" },
      { input: "[2,7,9,3,1]", output: "12" },
    ],
    constraints: "1 <= nums.length <= 100",
  },
  {
    title: "Edit Distance",
    topic: "dp",
    difficulty: "hard",
    description:
      "Find the minimum number of operations to convert word1 to word2.",
    examples: [
      { input: `word1="horse", word2="ros"`, output: "3" },
      { input: `word1="intention", word2="execution"`, output: "5" },
    ],
    constraints: "1 <= word.length <= 500",
  },

  // GRAPHS
  {
    title: "Valid Tree",
    topic: "graphs",
    difficulty: "easy",
    description: "Determine if the graph is a valid tree.",
    examples: [
      { input: "n=5, edges=[[0,1],[0,2],[0,3],[1,4]]", output: "true" },
      { input: "n=5, edges=[[0,1],[1,2],[2,3],[1,3],[1,4]]", output: "false" },
    ],
    constraints: "1 <= n <= 2 * 10^5",
  },
  {
    title: "Course Schedule",
    topic: "graphs",
    difficulty: "medium",
    description:
      "Return true if you can finish all courses given prerequisites.",
    examples: [
      { input: "numCourses=2, prerequisites=[[1,0]]", output: "true" },
      { input: "numCourses=2, prerequisites=[[1,0],[0,1]]", output: "false" },
    ],
    constraints: "1 <= numCourses <= 10^5",
  },
  {
    title: "Shortest Path (Dijkstra)",
    topic: "graphs",
    difficulty: "hard",
    description: "Find the shortest path in weighted graph from a source node.",
    examples: [
      {
        input: "Graph: 0→1 (4), 0→2 (1), 2→1 (2), 1→3 (1)",
        output: "Distance to 3 = 4",
      },
      { input: "[No path case]", output: "Infinity" },
    ],
    constraints: "1 <= nodes <= 10^5",
  },
];

//
// Build final docs
//

const docs = seedList.map((p, i) => ({
  title: `${p.title} (${p.difficulty})`,
  slug: `${p.topic}-${p.difficulty}-${Date.now()}-${i}`,
  description: p.description,
  topic: p.topic,
  difficulty: p.difficulty,
  examples: p.examples, // ← REAL examples
  constraints: p.constraints || null,
  supportedLanguages: ["javascript", "python", "java", "cpp"],
  generatedByAI: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

//
// Seeder
//
async function seed() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.MONGO_DBNAME || undefined,
    });

    const db = mongoose.connection.db;
    const coll = db.collection("problems");

    // delete existing seed duplicates
    await coll.deleteMany({
      title: { $in: docs.map((d) => d.title) },
    });

    const res = await coll.insertMany(docs);
    console.log("Inserted count:", res.insertedCount);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
