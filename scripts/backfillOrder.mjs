// scripts/backfillOrder.mjs
import mongoose from "mongoose";
import { Problem } from "../lib/models/problem.ts";

await mongoose.connect(process.env.MONGODB_URI);

//p1
await Problem.updateOne({ title: "Sum of Two Numbers (easy)" }, { order: 1 });
await Problem.updateOne({ title: "Reverse a String (easy)" }, { order: 2 });
await Problem.updateOne(
  { title: "Subarray with Given Sum (medium)" },
  { order: 3 },
);
await Problem.updateOne(
  { title: "Longest Substring Without Repeating (medium)" },
  { order: 4 },
);

//p2
await Problem.updateOne(
  { title: "Largest Subarray Product (hard)" },
  { order: 1 },
);
await Problem.updateOne(
  { title: "Regular Expression Matching (hard)" },
  { order: 2 },
);
await Problem.updateOne({ title: "Reverse Linked List (easy)" }, { order: 3 });

//p3
await Problem.updateOne(
  { title: "Detect Cycle in Linked List (medium)" },
  { order: 1 },
);
await Problem.updateOne({ title: "Merge K Sorted Lists (hard)" }, { order: 2 });
await Problem.updateOne({ title: "Valid Tree (easy)" }, { order: 3 });
await Problem.updateOne({ title: "Climbing Stairs (easy)" }, { order: 4 });

//p4
await Problem.updateOne({ title: "Course Schedule (medium)" }, { order: 1 });
await Problem.updateOne(
  { title: "Shortest Path (Dijkstra) (hard)" },
  { order: 2 },
);
await Problem.updateOne({ title: "House Robber (medium)" }, { order: 3 });
await Problem.updateOne({ title: "Edit Distance (hard)" }, { order: 4 });

//p5
await Problem.updateOne({ title: "Sum of Two Numbers (easy)" }, { order: 1 });
await Problem.updateOne({ title: "Reverse a String (easy)" }, { order: 2 });
await Problem.updateOne(
  { title: "Subarray with Given Sum (medium)" },
  { order: 3 },
);
await Problem.updateOne(
  { title: "Longest Substring Without Repeating (medium)" },
  { order: 4 },
);
await Problem.updateOne(
  { title: "Largest Subarray Product (hard)" },
  { order: 5 },
);
await Problem.updateOne(
  { title: "Regular Expression Matching (hard)" },
  { order: 6 },
);
await Problem.updateOne({ title: "Reverse Linked List (easy)" }, { order: 7 });
await Problem.updateOne(
  { title: "Detect Cycle in Linked List (medium)" },
  { order: 8 },
);
await Problem.updateOne({ title: "Merge K Sorted Lists (hard)" }, { order: 9 });
await Problem.updateOne({ title: "Valid Tree (easy)" }, { order: 10 });
await Problem.updateOne({ title: "Climbing Stairs (easy)" }, { order: 11 });
await Problem.updateOne({ title: "Course Schedule (medium)" }, { order: 12 });
await Problem.updateOne(
  { title: "Shortest Path (Dijkstra) (hard)" },
  { order: 13 },
);
await Problem.updateOne({ title: "House Robber (medium)" }, { order: 14 });
await Problem.updateOne({ title: "Edit Distance (hard)" }, { order: 15 });

console.log(" order backfilled for all phases");
process.exit(0);
