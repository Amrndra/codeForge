# ⚡ CodeForge

> **A distributed competitive programming platform with real-time judging powered by Node.js, Next.js, Redis, BullMQ, Docker, and MongoDB.**

---

## 🚀 Quick Start

### 1. Clone & Setup
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

### 4. Seed Database (Optional)
```bash
cd backend && npm run seed
```

### 5. Run Local Services
Open **three terminals**:

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

## 🏗️ Architecture Overview

CodeForge decouples API request handling from code execution using an **asynchronous producer-consumer pattern**:

```text
[ User Code ] → [ Next.js Frontend ] → [ Express API ] → [ BullMQ Queue ] → [ Redis ] → [ Docker Workers ] → [ MongoDB ]
```

![CodeForge Architecture](assets/architecture.svg)

### Key Highlights
- **Non-blocking API:** Submissions are queued instantly via BullMQ and Redis.
- **Isolated Execution:** User code runs securely inside ephemeral Docker containers.
- **Horizontal Scaling:** Spin up multiple worker nodes without changing API logic.

---

## ✨ Features

* **User System:** JWT Auth, Role-based access control (User/Admin), profile avatars, token rotation.
* **Problem Management:** Problem CRUD, difficulty levels, markdown descriptions, and test case evaluation.
* **Contests:** Timed competitions, registrations, live leaderboards, and penalty scoring.
* **Code Judge:** Multi-testcase evaluation, execution limits (Time/Memory), automated verdicts (AC, WA, TLE, MLE, CE, RE).

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 16, React 19, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js, Mongoose
* **Queue & Cache:** Redis, BullMQ
* **Code Execution:** Docker Engine
* **Database:** MongoDB

---

## 📄 License & Credits

Built with ❤️ by **[Amarendra](https://github.com/Amrndra)**.

Licensed under the **MIT License**.
