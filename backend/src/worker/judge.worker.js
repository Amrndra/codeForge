import { Worker } from "bullmq";
import redis from "../queue/redis.js";

import { judgeSubmission } from "../services/judge.service.js";
import { startHeartbeat, setBusy, setIdle } from "./heartbeat.js";

startHeartbeat();

const worker = new Worker("judge-queue", async job => {
    console.log("REDIS_URL:", process.env.UPSTASH_REDIS_REST_URL);
    try {
        await judgeSubmission(job.data);
    }
    catch (err) {
        console.log("Judge error :", err);
        throw err;
    }
}, { connection: redis });

worker.on("active", async (job) => {
    await setBusy(`judge-queue: Job #${job.id}`);
});

worker.on("completed", async (job) => {
    await setIdle();
});

worker.on("failed", async (job, err) => {
    console.error(`Job ${job?.id} failed`, err);
});

worker.on("error", async (err) => {
    console.error(err);
});

export { worker };