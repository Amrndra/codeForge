# ⚡ CodeForge

> **A distributed competitive programming platform featuring asynchronous code evaluation, docker container sandboxing, and real-time contest judging.**

---

## ⚡ Quick Start

### 1. Setup Project
```bash
git clone https://github.com/Amrndra/codeForge.git
cd codeForge
```

### 2. Environment Variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Seed Initial Data (Optional)
```bash
cd backend && npm run seed
```

### 5. Launch Local Services
Open **three separate terminals**:

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Queue Worker
cd backend && npm run worker

# Terminal 3 — Frontend UI
cd frontend && npm run dev
```

* **Frontend:** `http://localhost:3000`
* **Backend API:** `http://localhost:5000`

---

## 🏗 System Architecture

CodeForge uses a decoupled, asynchronous producer-consumer architecture to keep the API server fast and responsive:

```text
[ User Submission ] ➔ [ Next.js Frontend ] ➔ [ Express API ] ➔ [ BullMQ Queue ] ➔ [ Redis ] ➔ [ Docker Workers ] ➔ [ MongoDB ]
```



* **Asynchronous Queueing:** Submissions are immediately acknowledged while BullMQ and Redis queue the evaluation work.
* **Sandboxed Execution:** User code is compiled and executed in ephemeral, isolated Docker containers.
* **Independent Scalability:** Easily scale evaluation capacity by launching additional worker processes.

---

## ✨ Features & Tech Stack

* **User Management:** JWT Authentication, Role-based authorization, Profile customization, Token rotation.
* **Problem & Contest Engine:** Multi-testcase evaluation, Markdown problem statements, Timed contests, Live leaderboards, Penalty calculations.
* **Online Judge:** Time Limit Exceeded (TLE), Memory Limit Exceeded (MLE), Compilation & Runtime Error handling.

### Tech Stack
* **Frontend:** Next.js 16, React 19, Tailwind CSS
* **Backend:** Node.js, Express.js, Mongoose
* **Queue & Execution:** Redis, BullMQ, Docker Engine
* **Database:** MongoDB

---

## 👤 Author

Created with ❤️ by **[Amarendra](https://github.com/Amrndra)**.
