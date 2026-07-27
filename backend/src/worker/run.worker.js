import { Worker } from "bullmq";
import redis from "../queue/redis.js";

import { runCode } from "../services/judge.service.js";
import { startHeartbeat, setBusy, setIdle } from "./heartbeat.js";

startHeartbeat();

const worker = new Worker("run-code-queue", async job => {
    try {
        return await runCode(job.data);
    }
    catch (err) {
        console.log("Run code error :", err);
        throw err;
    }
}, { connection: redis });

worker.on("active", async (job) => {
    await setBusy(`run-code-queue: Job #${job.id}`);
});

worker.on("completed", async () => {
    await setIdle();
});

worker.on("failed", async (job, err) => {
    console.error(`Run code job ${job?.id} failed`, err);
});

worker.on("error", async (err) => {
    console.error(err);
});

export { worker };