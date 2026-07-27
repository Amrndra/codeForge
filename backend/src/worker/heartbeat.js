import os from "os";
import redis from "../queue/redis.js";

const workerId = `${os.hostname()}-${process.pid}`;
let startedAt = null;
let status = "idle";
let currentJob = null;
let jobsProcessed = 0;
let intervalId = null;

/**
 * Generates the worker status document.
 */
function getWorkerDocument() {
    return {
        workerId,
        status,
        currentJob,
        jobsProcessed,
        startedAt,
        lastSeen: new Date().toISOString()
    };
}

/**
 * Saves the current worker state to Redis.
 */
async function saveToRedis() {
    try {
        const doc = getWorkerDocument();
        const key = `worker:${workerId}`;
        // Store the status document as a JSON string with a 60-second TTL
        await redis.set(key, JSON.stringify(doc), "EX", 60);
    } catch (err) {
        console.error("Failed to update worker heartbeat in Redis:", err);
    }
}

/**
 * Starts the heartbeat timer and initializes the worker state.
 */
export function startHeartbeat() {
    if (!startedAt) {
        startedAt = new Date().toISOString();
    }
    status = "idle";

    // Initial save to Redis
    saveToRedis();

    // Set up interval to periodically update lastSeen and refresh TTL
    if (!intervalId) {
        intervalId = setInterval(() => {
            saveToRedis();
        }, 10000); // Update every 10 seconds

        // Prevent the interval from keeping the process alive if there's no other work
        if (intervalId.unref) {
            intervalId.unref();
        }
    }
}

/**
 * Sets the worker status to busy and records the current job.
 * @param {string} jobName
 */
export async function setBusy(jobName) {
    status = "busy";
    currentJob = jobName;
    await saveToRedis();
}

/**
 * Sets the worker status to idle, clears the current job, and increments processed count if it was busy.
 */
export async function setIdle() {
    if (status === "busy") {
        jobsProcessed += 1;
    }
    status = "idle";
    currentJob = null;
    await saveToRedis();
}
