import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config();

await connectDB();

await import("./worker/judge.worker.js");
await import("./worker/run.worker.js");

console.log("🚀 Worker started");