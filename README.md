🚀 DSA Nexus

- Practice DSA smartly. Track progress. Improve faster -

🌐Live Demo:https://dsa-coach-mauve.vercel.app/

DSA Nexus is a full-stack web app built to help beginners and intermediate developers practice Data Structures & Algorithms in a structured, feedback-driven way — not just solve random problems and forget them.
This project focuses on learning visibility: knowing what you solved, where you struggle, and what to fix next.

🎯 Why DSA Nexus?

Most platforms tell you what to solve.
DSA Nexus tells you how you are actually doing.
It tracks your progress deeply and highlights:

- what you’ve mastered
- where you’re weak
- which problems you repeatedly struggle with
- provides you a structured roadmap
  This turns DSA practice from guesswork into a clear improvement loop.

👥 Target Audience

- Beginners starting DSA who want structure.
- Intermediate developers preparing for interviews and wanting insight into their weak areas.

✨ Core Features

✅ 1. Problem Practice & Evaluation

- Solve curated DSA problems by topic and difficulty
- Submit solutions and get evaluated
- Supports multiple verdicts (correct / suboptimal / incorrect)

📊 2. Progress Tracking (Topic + Difficulty)

- Tracks attempts, failures, and solved count
- Progress breakdown by:
  > Topic (arrays, strings, etc.)
  > Difficulty (easy / medium / hard)
- Always shows fresh data (no stale cache issues)

🧠 3. Weak Areas Detection

- Automatically detects weak topics based on:
  > failure rate
  > repeated incorrect attempts
- Helps users focus on what actually needs improvement

⚠️ 4. Struggled Problems Detection

- Flags problems where the user:
  > fails multiple times
  > submits suboptimal solutions repeatedly
- Auto-hides problems once the user genuinely improves.

🤖 5. AI Assistant

- On-demand help while solving problems.
- Provides:
  > hints
  > explanations
  > guidance without directly giving answers
- Designed to assist learning, not replace thinking.

🔐 6. Authentication

- Secure email + password authentication.
- Built using NextAuth.
- JWT-based sessions (production-ready).
- Proper session & token typing (TypeScript safe).

🧱 Tech Stack

- Frontend

* HTML
* CSS
* TypeScript
* React.js
* Next.js (App Router)
* Tailwind CSS

- Backend

* Next.js API Routes
* MongoDB
* Mongoose
* NextAuth (JWT strategy)

- Code Evaluation

* Judge0 API (for solution execution & verdicts)

- Deployment

* Vercel

🏗️ Architecture Highlights

- Clean separation of concerns (auth, progress, submissions).
- Server-side auth verification on every protected API.
- No unsafe any usage in core logic.
- Cache-safe APIs (no-store) to avoid stale progress data.
- Versioned release (v1.0.0) for rollback safety.

📈 Current Status

- Fully deployed.
- Auth, submissions, progress, AI assistant working.
- Stable release tagged as v1.0.0.
- Actively evolving (features added on top of a stable base).

🧪 Local Setup

git clone https://github.com/Adhil074/dsa-coach.git
cd dsa-coach
npm install
npm run dev

Create a .env.local file with:

MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
JUDGE0_API_URL=...
JUDGE0_API_KEY=...

🧠 What This Project Demonstrates Recruiters?

- Demonstrates ability to build end-to-end production applications.
- Demonstrates ability to understand state, auth, data consistency.
- Demonstrates ability to care about real user problems, not just features.
- Demonstrates ability to debug, refactor, and stabilize complex flows.
- Demonstrates ability to ship, deploy, version, and iterate properly.

📌 Roadmap (Planned for future)

- Company-specific problem sets
- Time & space complexity insights
- Personalized daily practice plan
- Performance analytics over time

👤 Author

Built by Adhil Mohammed.
Focused on clean architecture, correctness, and real learning impact.
