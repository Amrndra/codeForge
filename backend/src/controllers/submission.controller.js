import Submission from "../models/submission.model.js";
import Contest from "../models/contest.model.js";
import ContestParticipant from "../models/contestParticipant.model.js";
import Problem from "../models/problem.model.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { addJobToJudgeQueue } from "../queue/judge.queue.js";
import { addJobToRunQueue, runQueue } from "../queue/run.queue.js";
import redis from "../queue/redis.js";

const submitSolution = asyncHandler(async (req, res) => {
    const { problemId, language, code, contestId } = req.body;

    // Validate all required fields
    if (problemId === undefined ||
        language === undefined ||
        code === undefined) {
        throw new ApiError(400, 'Missing required fields: problemId, language, and code are required.');
    }

    if (!code.trim()) {
        throw new ApiError(400, 'Code cannot be empty.');
    }
    // Demo limitation: Check if the user has exceeded the daily submission limit

    const MAX_SUBMISSIONS_PER_DAY = process.env.MAX_SUBMISSIONS_PER_DAY ? parseInt(process.env.MAX_SUBMISSIONS_PER_DAY) : 200;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Submission.countDocuments({
        user: req.user._id,
        createdAt: { $gte: today }
    });

    if (count >= MAX_SUBMISSIONS_PER_DAY) {
        throw new ApiError(
            429,
            "Daily submission limit reached."
        );
    }

    // Atleast 30 seconds gap between two submissions
    const lastSubmission = await Submission.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    if (lastSubmission) {
        const timeSinceLastSubmission = (Date.now() - lastSubmission.createdAt.getTime()) / 1000; // in seconds
        if (timeSinceLastSubmission < 30) {
            throw new ApiError(
                429,
                `Please wait ${Math.ceil(30 - timeSinceLastSubmission)} seconds before submitting again.`
            );
        }
    }

    // Validate the problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new ApiError(404, 'Problem not found.');
    }
    let participant = null;
    if (contestId) {
        // Validate the contest
        const contest = await Contest.findById(contestId);
        if (!contest) {
            throw new ApiError(404, 'Contest not found.');
        }

        // Check if the user is a participant of the contest
        participant = await ContestParticipant.findOne({
            user: req.user._id,
            contest: contestId
        });

        if (!participant) {
            throw new ApiError(403, 'You are not a participant of this contest.');
        }
    }

    // Create a new submission
    const submission = new Submission({
        user: req.user._id,
        problem: problemId,
        contest: contestId || null,
        language,
        code
    });

    await submission.save();

    // Queue the job to the judge queue
    try {
        await addJobToJudgeQueue({
            submissionId: submission._id,
            contestId: contestId || null,
            contestParticipantId: participant ? participant._id : null
        })
    }
    catch (error) {
        console.error("Error adding job to queue", error);
        throw new ApiError(500, 'Unable to queue submission. Please try again.');
    }

    res.status(201).json(new ApiResponse(201, 'Submission created successfully.', { submissionId: submission._id }));

});

const getSubmission = asyncHandler(async (req, res) => {
    const submissionId = req.params.submissionId;

    const submission = await Submission.findById(submissionId)

    if (!submission) {
        throw new ApiError(404, 'Submission not found.');
    }

    // Ensure the user can only view their own submissions or if they are an admin
    if (!submission.user.equals(req.user._id) && req.user.role !== 'admin') {
        throw new ApiError(403, 'You do not have permission to view this submission.');
    }

    res.status(200).json(new ApiResponse(200, 'Submission retrieved successfully.', { submission }));
});

const getMySubmissions = asyncHandler(async (req, res) => {
    const submissions = await Submission.find({
        user: req.user._id
    })
        .sort({ createdAt: -1 })
        .populate('problem', 'title slug')
        .populate('contest', "title");

    return res.status(200).json(
        new ApiResponse(
            200,
            'Submissions retrieved successfully.',
            { submissions }
        )
    );
});

const runCodeInWorker = asyncHandler(async (req, res) => {
    const {
        problemId,
        language,
        code,
        sampleTestCases = [],
        customTestCases = []
    } = req.body;

    if (problemId === undefined || language === undefined || code === undefined) {
        throw new ApiError(400, 'Missing required fields: problemId, language, and code are required.');
    }

    if (!code.trim()) {
        throw new ApiError(400, 'Code cannot be empty.');
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new ApiError(404, 'Problem not found.');
    }

    const normalizeTestCases = (cases) =>
        (Array.isArray(cases) ? cases : [])
            .filter((testCase) => {
                if (!testCase) {
                    return false;
                }

                const input = typeof testCase.input === 'string' ? testCase.input.trim() : '';
                const output = typeof testCase.output === 'string' ? testCase.output.trim() : '';

                return input !== '' || output !== '';
            })
            .map((testCase) => ({
                input: String(testCase.input ?? ''),
                output: typeof testCase.output === 'string' ? testCase.output : ''
            }));

    const combinedTestCases = [
        ...normalizeTestCases(sampleTestCases),
        ...normalizeTestCases(customTestCases)
    ];

    if (combinedTestCases.length === 0) {
        throw new ApiError(400, 'At least one test case is required to run code.');
    }

    // Demo limitation: Check if the user has exceeded the daily run limit
    const today = new Date().toISOString().split("T")[0]; // 2026-07-06
    const key = `run-limit:${req.user._id}:${today}`;

    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, 24 * 60 * 60);
    }

    if (count > process.env.MAX_RUNS_PER_DAY) {
        throw new ApiError(
            429,
            `Daily run limit of ${process.env.MAX_RUNS_PER_DAY} reached.`
        );
    }

    // Demo limitation: At least 10 seconds gap between two runs
    const lastRunKey = `last-run:${req.user._id}`;
    const lastRunTimestamp = await redis.get(lastRunKey);

    if (lastRunTimestamp) {
        const timeSinceLastRun = (Date.now() - parseInt(lastRunTimestamp, 10)) / 1000; // in seconds
        if (timeSinceLastRun < 10) {
            throw new ApiError(
                429,
                `Please wait ${Math.ceil(10 - timeSinceLastRun)} seconds before running code again.`
            );
        }
    }

    await redis.set(lastRunKey, Date.now().toString());

    try {
        const job = await addJobToRunQueue({
            problemId: problem._id.toString(),
            language,
            code,
            timeLimit: problem.timelimit / 1000,
            memoryLimit: problem.memorylimit,
            testCases: combinedTestCases
        });

        res.status(202).json(new ApiResponse(202, 'Run code job queued successfully.', {
            jobId: job.id
        }));
    }
    catch (error) {
        console.error('Error adding run code job to queue', error);
        throw new ApiError(500, 'Unable to queue run code request. Please try again.');
    }
});

const getRunCodeResult = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await runQueue.getJob(jobId);

    if (!job) {
        throw new ApiError(404, 'Run code job not found.');
    }

    const state = await job.getState();

    if (state === 'completed') {
        return res.status(200).json(new ApiResponse(200, 'Run code result retrieved successfully.', {
            state,
            result: job.returnvalue
        }));
    }

    if (state === 'failed') {
        return res.status(200).json(new ApiResponse(200, 'Run code job failed.', {
            state,
            failedReason: job.failedReason || 'Run code job failed.'
        }));
    }

    return res.status(200).json(new ApiResponse(200, 'Run code job is still processing.', {
        state
    }));
});

export {
    submitSolution,
    getSubmission,
    getMySubmissions,
    runCodeInWorker,
    getRunCodeResult
};