import redis from "./redis.js";
import { Queue } from "bullmq";

const runQueue = new Queue(
    "run-code-queue",
    {
        connection: redis,
        defaultJobOptions: {
            attempts: 1,
            removeOnComplete: 100,
            removeOnFail: 100,
        }
    }
);

async function addJobToRunQueue(data) {
    return await runQueue.add(
        "run-code",
        data
    );
}

export { addJobToRunQueue, runQueue };