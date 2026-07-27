import redis from "./redis.js";
import { Queue } from "bullmq";

const judgeQueue = new Queue(
    "judge-queue",
    {
        connection: redis,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: 100,
            removeOnFail: 100,
        }
    }
);

async function addJobToJudgeQueue(data) {
    await judgeQueue.add(
        "judge-submission",
        data
    );
}

export { addJobToJudgeQueue, judgeQueue };