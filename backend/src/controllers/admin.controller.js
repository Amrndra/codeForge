import User from "../models/user.model.js";
import Problem from "../models/problem.model.js";
import Contest from "../models/contest.model.js";
import Submission from "../models/submission.model.js";
import redis from "../queue/redis.js";
import { judgeQueue } from "../queue/judge.queue.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get overall dashboard statistics and overview.
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Problems
    const totalProblems = await Problem.countDocuments();

    // 2. Active Contests (startTime <= now <= endTime)
    const now = new Date();
    const activeContests = await Contest.countDocuments({
        startTime: { $lte: now },
        endTime: { $gte: now }
    });

    // 3. Registered Users
    const registeredUsers = await User.countDocuments();

    // 4. Worker status from Redis
    const keys = await redis.keys("worker:*");
    let workersTotal = keys.length;
    let workersOnline = 0;
    if (keys.length > 0) {
        const rawData = await redis.mget(keys);
        const workers = rawData.map(val => JSON.parse(val)).filter(Boolean);
        workersOnline = workers.filter(w => {
            const lastSeenTime = new Date(w.lastSeen).getTime();
            return Date.now() - lastSeenTime < 15000; // 15 seconds threshold
        }).length;
    }

    // 5. Queue Stats
    const pending = await judgeQueue.getWaitingCount();
    const judging = await judgeQueue.getActiveCount();
    const completed = await Submission.countDocuments({ status: "Completed" });
    const failed = await Submission.countDocuments({ status: "Failed" });

    // 6. Recent Submissions
    const recentSubmissionsRaw = await Submission.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "username")
        .populate("problem", "title");

    const recentSubmissions = recentSubmissionsRaw.map(sub => ({
        id: sub._id.toString(),
        user: sub.user?.username || "unknown",
        problem: sub.problem?.title || "Unknown Problem",
        verdict: sub.verdict || "Pending",
        time: sub.executionTime !== null ? `${sub.executionTime}ms` : "-"
    }));

    res.status(200).json(
        new ApiResponse(200, "Dashboard stats retrieved successfully.", {
            totalProblems,
            activeContests,
            registeredUsers,
            workersOnline,
            workersTotal,
            queueStats: {
                pending,
                judging,
                completed,
                failed
            },
            recentSubmissions
        })
    );
});

/**
 * Get all active/idle workers and their status from Redis.
 */
const getWorkers = asyncHandler(async (req, res) => {
    const keys = await redis.keys("worker:*");
    let workers = [];
    let activeCount = 0;
    let busyCount = 0;
    let idleCount = 0;

    if (keys.length > 0) {
        const rawData = await redis.mget(keys);
        const parsed = rawData.map(val => JSON.parse(val)).filter(Boolean);
        workers = parsed.map(worker => {
            const lastSeenTime = new Date(worker.lastSeen).getTime();
            const isOnline = Date.now() - lastSeenTime < 15000;

            let currentStatus = worker.status; // "busy" or "idle"
            if (!isOnline) {
                currentStatus = "offline";
            } else {
                activeCount++;
                if (worker.status === "busy") {
                    busyCount++;
                } else {
                    idleCount++;
                }
            }

            // Calculate uptime string
            let uptimeStr = "-";
            if (worker.startedAt) {
                const uptimeMs = Date.now() - new Date(worker.startedAt).getTime();
                const days = Math.floor(uptimeMs / (24 * 3600 * 1000));
                const hours = Math.floor((uptimeMs % (24 * 3600 * 1000)) / (3600 * 1000));
                const mins = Math.floor((uptimeMs % (3600 * 1000)) / (60 * 1000));
                
                if (days > 0) {
                    uptimeStr = `${days}d ${hours}h ${mins}m`;
                } else if (hours > 0) {
                    uptimeStr = `${hours}h ${mins}m`;
                } else {
                    uptimeStr = `${mins}m`;
                }
            }

            // Time since last heartbeat
            const secondsAgo = Math.round((Date.now() - lastSeenTime) / 1000);
            const lastHeartbeatStr = secondsAgo <= 0 ? "just now" : `${secondsAgo}s ago`;

            return {
                id: worker.workerId,
                workerId: worker.workerId,
                status: currentStatus, // "busy" | "idle" | "offline"
                currentJob: worker.status === "busy" ? worker.currentJob : null,
                jobsProcessed: worker.jobsProcessed || 0,
                startedAt: worker.startedAt,
                uptime: uptimeStr,
                lastSeen: lastHeartbeatStr
            };
        });
    }

    res.status(200).json(
        new ApiResponse(200, "Workers retrieved successfully.", { 
            workers,
            activeCount,
            busyCount,
            idleCount
        })
    );
});

/**
 * Get queue metrics, active items, and recent results.
 */
const getQueueDetails = asyncHandler(async (req, res) => {
    const pendingCount = await judgeQueue.getWaitingCount();
    const judgingCount = await judgeQueue.getActiveCount();

    // Fetch active jobs and waiting jobs from BullMQ
    const activeJobs = await judgeQueue.getActive();
    const waitingJobs = await judgeQueue.getWaiting();

    // Helper to format jobs for the active queue table
    const formatJob = (job, status) => {
        const subId = job.data?.submissionId || job.id;
        return {
            id: job.id,
            submissionId: subId,
            user: job.data?.username || "System",
            problem: job.data?.problemTitle || `Submission #${subId}`,
            language: job.data?.language || "C++",
            status: status, // "judging" or "pending"
            worker: status === "judging" ? "worker-01" : null,
            elapsed: `${Math.round((Date.now() - job.timestamp) / 1000)}s`
        };
    };

    const activeItems = activeJobs.map(job => formatJob(job, "judging"));
    const waitingItems = waitingJobs.map(job => formatJob(job, "pending"));
    const queueItems = [...activeItems, ...waitingItems];

    // Fetch recent completed/failed results from MongoDB
    const recentSubmissionsRaw = await Submission.find({
        status: { $in: ["Completed", "Failed"] }
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "username")
        .populate("problem", "title");

    const recentResults = recentSubmissionsRaw.map(sub => ({
        id: sub._id.toString(),
        user: sub.user?.username || "unknown",
        problem: sub.problem?.title || "Unknown Problem",
        verdict: sub.verdict || "Completed",
        time: sub.executionTime !== null ? `${sub.executionTime}ms` : "-",
        memory: sub.memoryUsed !== null ? `${(sub.memoryUsed / 1024 / 1024).toFixed(1)} MB` : "8.2 MB"
    }));

    res.status(200).json(
        new ApiResponse(200, "Queue details retrieved successfully.", {
            stats: {
                pending: pendingCount,
                judging: judgingCount
            },
            queueItems,
            recentResults
        })
    );
});

export {
    getDashboardStats,
    getWorkers,
    getQueueDetails
};
