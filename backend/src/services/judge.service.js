import { ApiError } from "../utils/ApiError.js";
import Submission from "../models/submission.model.js";
import Problem from "../models/problem.model.js";
import { updateContestParticipant } from "./contest.service.js";
import fs from "fs";
import path from "path";

const mapLanguage = (lang) => {
    const l = lang.toLowerCase();
    if (l.includes("c++") || l === "cpp") return "cpp";
    if (l.includes("java")) return "java";
    if (l.includes("python") || l === "py") return "python";
    if (l.includes("javascript") || l === "js") return "javascript";
    return l;
};

const executePiston = async (language, code, stdin) => {
    const pistonLang = mapLanguage(language);
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            language: pistonLang,
            version: "*",
            files: [
                {
                    content: code
                }
            ],
            stdin: stdin
        })
    });
    if (!response.ok) {
        throw new Error(`Piston API returned status ${response.status}`);
    }
    const data = await response.json();
    
    // Check if compilation failed
    if (data.compile && data.compile.code !== 0) {
        return {
            compiled: false,
            error: data.compile.output || data.compile.stderr,
            stdout: "",
            stderr: data.compile.stderr || data.compile.output,
            code: data.compile.code
        };
    }
    
    return {
        compiled: true,
        stdout: data.run.stdout,
        stderr: data.run.stderr,
        code: data.run.code,
        signal: data.run.signal,
        output: data.run.output
    };
};

const normalizeJudgeText = (value) =>
    String(value ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
        .trim();

const submissionUpdateHelper = async (
    {
        submission,
        verdict,
        status,
        contestId,
        contestParticipantId,
        executionTime = null
    }
) => {
    submission.status = status;
    submission.verdict = verdict;
    if (executionTime !== null) {
        submission.executionTime = executionTime;
    }

    await submission.save();

    if (contestId && contestParticipantId) {
        await updateContestParticipant(submission._id, contestId, contestParticipantId);
    }
};

export const judgeSubmission = async (
    {
        submissionId,
        contestId,
        contestParticipantId
    }
) => {
    const submission = await Submission.findById(submissionId);

    console.log("Judging submission:", submissionId);

    if (!submission) {
        throw new ApiError(404, "Submission not found.");
    }

    const problem = await Problem.findById(submission.problem);

    if (!problem) {
        throw new ApiError(404, "Problem not found.");
    }

    submission.status = "Judging";
    await submission.save();

    try {
        const testcasesDir = path.join(process.cwd(), "storage", "testcases", submission.problem.toString());
        
        let testcasesList = [];

        if (fs.existsSync(testcasesDir)) {
            const files = fs.readdirSync(testcasesDir)
                .filter(file => file.startsWith("input"))
                .sort();
            
            for (const file of files) {
                try {
                    const input = fs.readFileSync(path.join(testcasesDir, file), "utf-8");
                    const expectedOutput = fs.readFileSync(path.join(testcasesDir, file.replace("input", "output")), "utf-8").trim();
                    testcasesList.push({ input, expectedOutput });
                } catch (e) {
                    console.error("Error reading testcase file:", e);
                }
            }
        }

        // Fallback to sampleTestCases if no local files found
        if (testcasesList.length === 0 && problem.sampleTestCases && problem.sampleTestCases.length > 0) {
            testcasesList = problem.sampleTestCases.map(tc => ({
                input: tc.input,
                expectedOutput: tc.output.trim()
            }));
        }

        if (testcasesList.length === 0) {
            await submissionUpdateHelper({
                submission,
                verdict: "Runtime Error",
                status: "Failed",
                contestId,
                contestParticipantId
            });
            return;
        }

        let allPassed = true;
        let maxTime = 0;

        for (const [index, tc] of testcasesList.entries()) {
            const start = Date.now();
            const result = await executePiston(submission.language, submission.code, tc.input);
            const elapsed = Date.now() - start;

            maxTime = Math.max(maxTime, elapsed);

            if (result.compiled === false) {
                await submissionUpdateHelper({
                    submission,
                    verdict: "Compilation Error",
                    status: "Completed",
                    contestId,
                    contestParticipantId
                });
                return;
            }

            if (elapsed > problem.timelimit) {
                await submissionUpdateHelper({
                    submission,
                    verdict: "Time Limit Exceeded",
                    status: "Completed",
                    contestId,
                    contestParticipantId
                });
                return;
            }

            if (result.signal === "SIGKILL" || result.code === 137) {
                await submissionUpdateHelper({
                    submission,
                    verdict: "Time Limit Exceeded",
                    status: "Completed",
                    contestId,
                    contestParticipantId
                });
                return;
            }

            if (result.code !== 0) {
                await submissionUpdateHelper({
                    submission,
                    verdict: "Runtime Error",
                    status: "Completed",
                    contestId,
                    contestParticipantId
                });
                return;
            }

            const actualOutput = normalizeJudgeText(result.stdout);
            const expectedOutput = normalizeJudgeText(tc.expectedOutput);

            if (actualOutput !== expectedOutput) {
                allPassed = false;
                break;
            }
        }

        await submissionUpdateHelper({
            submission,
            verdict: allPassed ? "Accepted" : "Wrong Answer",
            status: "Completed",
            contestId,
            contestParticipantId,
            executionTime: maxTime
        });

    } catch (error) {
        console.error("Judge Error:", error);
        await submissionUpdateHelper({
            submission,
            verdict: "Runtime Error",
            status: "Failed",
            contestId,
            contestParticipantId
        });
    }
};

export const runCode = async ({
    testCases = [],
    code,
    timeLimit,
    memoryLimit,
    language = "C++"
} = {}) => {
    try {
        const results = [];
        const cases = Array.isArray(testCases) ? testCases : [];

        for (const [index, tc] of cases.entries()) {
            const expectedOutput = typeof tc.output === "string"
                ? normalizeJudgeText(tc.output)
                : null;

            const start = Date.now();
            const result = await executePiston(language, code, tc.input);
            const elapsed = Date.now() - start;

            if (result.compiled === false) {
                return {
                    status: "Compilation Error",
                    output: result.error,
                    results: []
                };
            }

            if (elapsed > (timeLimit * 1000)) {
                results.push({
                    index,
                    status: "Time Limit Exceeded",
                    input: tc.input,
                    expectedOutput,
                    output: ""
                });
                break;
            }

            if (result.signal === "SIGKILL" || result.code === 137) {
                results.push({
                    index,
                    status: "Time Limit Exceeded",
                    input: tc.input,
                    expectedOutput,
                    output: ""
                });
                break;
            }

            if (result.code !== 0) {
                results.push({
                    index,
                    status: "Runtime Error",
                    input: tc.input,
                    expectedOutput,
                    output: normalizeJudgeText(result.stderr || result.output)
                });
                break;
            }

            const actualOutput = normalizeJudgeText(result.stdout);
            const isAccepted = expectedOutput === null
                ? true
                : expectedOutput === actualOutput;

            results.push({
                index,
                status: isAccepted ? "Accepted" : "Wrong Answer",
                input: tc.input,
                expectedOutput,
                output: actualOutput
            });

            if (!isAccepted) {
                break;
            }
        }

        const overallStatus = results.find(result => result.status !== "Accepted")?.status || "Accepted";

        return {
            status: overallStatus,
            output: results.length > 0
                ? "Run completed."
                : "No test cases were provided.",
            results
        };
    } catch (error) {
        console.error("Run Code Error:", error);
        return {
            status: "Runtime Error",
            output: `Execution error: ${error?.message || 'Unknown error'}`,
            results: []
        };
    }
};