import { ApiError } from "../utils/ApiError.js";
import Submission from "../models/submission.model.js";
import Problem from "../models/problem.model.js";
import fs from "fs";
import path from "path";
import { updateContestParticipant } from "./contest.service.js";

// Language mapping config for Glot.io
const GLOT_LANG_MAP = {
    "cpp":        { glotLang: "cpp",        filename: "main.cpp"    },
    "c++":        { glotLang: "cpp",        filename: "main.cpp"    },
    "python":     { glotLang: "python",     filename: "main.py"     },
    "java":       { glotLang: "java",       filename: "Main.java"   },
    "javascript": { glotLang: "javascript", filename: "main.js"     },
};

/**
 * Execute code via Glot.io API
 */
const executeViaGlot = async (language, code, stdin = "") => {
    const lookupLang = String(language ?? "").toLowerCase();
    const langConfig = GLOT_LANG_MAP[lookupLang];

    if (!langConfig) {
        return {
            stdout: "",
            stderr: "",
            error: `Language "${language}" is not supported by the execution engine.`,
        };
    }

    const { glotLang, filename } = langConfig;
    
    // If GLOT_TOKEN is configured in .env, use the standard authenticated endpoint.
    // Otherwise fallback to the keyless run.glot.io endpoint.
    const token = process.env.GLOT_TOKEN;
    const url = token 
        ? `https://glot.io/api/run/${glotLang}/latest`
        : `https://run.glot.io/languages/${glotLang}/versions/latest`;

    const payload = {
        files: [
            {
                name: filename,
                content: code,
            },
        ],
        stdin: stdin,
    };

    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000), // Abort after 15 seconds
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            return {
                stdout: "",
                stderr: "",
                error: `Glot.io API error (HTTP ${response.status}): ${errorText || response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            stdout: data.stdout ?? "",
            stderr: data.stderr ?? "",
            error: data.error ?? "",
        };
    } catch (err) {
        const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
        return {
            stdout: "",
            stderr: "",
            error: isTimeout
                ? "Execution timed out waiting for Glot.io response."
                : `Network error contacting Glot.io: ${err?.message || "Unknown error"}`,
        };
    }
};

const normalizeJudgeText = (value) =>
    String(value ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
        .trim();

const submissionUpdateHelper = async ({
    submission,
    verdict,
    status,
    contestId,
    contestParticipantId,
    executionTime = null,
}) => {
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

export const judgeSubmission = async ({
    submissionId,
    contestId,
    contestParticipantId,
}) => {
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
        const testcasesDir = path.join(
            process.cwd(),
            "storage",
            "testcases",
            submission.problem.toString()
        );

        fs.mkdirSync(testcasesDir, { recursive: true });

        const testcaseFiles = fs
            .readdirSync(testcasesDir)
            .filter((f) => f.startsWith("input"))
            .sort();

        if (testcaseFiles.length === 0) {
            // No hidden test cases on disk — treat as instant WA so it doesn't stay Pending
            await submissionUpdateHelper({
                submission,
                verdict: "Wrong Answer",
                status: "Completed",
                contestId,
                contestParticipantId,
            });
            return;
        }

        let allPassed = true;
        let maxTime = 0;
        const timelimitSec = problem.timelimit / 1000;

        for (const testcaseFile of testcaseFiles) {
            let input = "";
            let expectedOutput = "";

            try {
                input = fs.readFileSync(
                    path.join(testcasesDir, testcaseFile),
                    "utf-8"
                );
                expectedOutput = normalizeJudgeText(
                    fs.readFileSync(
                        path.join(testcasesDir, testcaseFile.replace("input", "output")),
                        "utf-8"
                    )
                );
            } catch {
                await submissionUpdateHelper({
                    submission,
                    verdict: "Runtime Error",
                    status: "Failed",
                    contestId,
                    contestParticipantId,
                });
                return;
            }

            console.log("Running testcase:", testcaseFile);

            const start = Date.now();
            const result = await executeViaGlot(submission.language, submission.code, input);
            const elapsed = Date.now() - start;

            if (result.error) {
                console.error("Glot execution error:", result.error);
                await submissionUpdateHelper({
                    submission,
                    verdict: "Runtime Error",
                    status: "Completed",
                    contestId,
                    contestParticipantId,
                });
                return;
            }

            // Check for compile errors
            if (!result.stdout && result.stderr) {
                const isCompileError =
                    result.stderr.includes("error:") ||
                    result.stderr.includes("SyntaxError") ||
                    result.stderr.includes("Exception in thread") ||
                    result.stderr.includes("cannot find symbol");

                if (isCompileError) {
                    await submissionUpdateHelper({
                        submission,
                        verdict: "Compilation Error",
                        status: "Completed",
                        contestId,
                        contestParticipantId,
                    });
                    return;
                }
            }

            // Time Limit Exceeded check
            if (elapsed > timelimitSec * 1000) {
                await submissionUpdateHelper({
                    submission,
                    verdict: "Time Limit Exceeded",
                    status: "Completed",
                    contestId,
                    contestParticipantId,
                });
                return;
            }

            maxTime = Math.max(maxTime, elapsed);

            const actualOutput = normalizeJudgeText(result.stdout);
            console.log("Expected:", JSON.stringify(expectedOutput));
            console.log("Actual:  ", JSON.stringify(actualOutput));

            if (actualOutput !== expectedOutput) {
                allPassed = false;
                break;
            }

            console.log("Passed testcase:", testcaseFile);
        }

        console.log("All testcases finished.");

        await submissionUpdateHelper({
            submission,
            verdict: allPassed ? "Accepted" : "Wrong Answer",
            status: "Completed",
            contestId,
            contestParticipantId,
            executionTime: maxTime,
        });
    } catch (error) {
        console.error("Judge Error:", error);
        await submissionUpdateHelper({
            submission,
            verdict: "Runtime Error",
            status: "Failed",
            contestId,
            contestParticipantId,
        });
    }
};

export const runCode = async ({
    testCases = [],
    code,
    timeLimit,
    memoryLimit,
    language = "C++",
} = {}) => {
    const lookupLang = String(language ?? "").toLowerCase();
    if (!GLOT_LANG_MAP[lookupLang]) {
        return {
            status: "Unsupported Language",
            output: `"${language}" is not supported for Run Code yet. Supported: C++, Python, Java, JavaScript.`,
            results: [],
        };
    }

    const cases = Array.isArray(testCases) ? testCases : [];
    const results = [];

    try {
        for (const [index, tc] of cases.entries()) {
            const expectedOutput =
                typeof tc.output === "string" ? normalizeJudgeText(tc.output) : null;

            const start = Date.now();
            const glotResult = await executeViaGlot(language, code, String(tc.input ?? ""));
            const elapsed = Date.now() - start;

            if (glotResult.error) {
                results.push({
                    index,
                    status: "Runtime Error",
                    input: tc.input,
                    expectedOutput,
                    output: glotResult.error,
                });
                break;
            }

            // Compilation error detection
            if (!glotResult.stdout && glotResult.stderr) {
                const isCompileError =
                    glotResult.stderr.includes("error:") ||
                    glotResult.stderr.includes("SyntaxError") ||
                    glotResult.stderr.includes("Exception in thread") ||
                    glotResult.stderr.includes("cannot find symbol");

                if (isCompileError) {
                    return {
                        status: "Compilation Error",
                        output: normalizeJudgeText(glotResult.stderr),
                        results: [],
                    };
                }
            }

            if (elapsed > timeLimit * 1000) {
                results.push({
                    index,
                    status: "Time Limit Exceeded",
                    input: tc.input,
                    expectedOutput,
                    output: "",
                });
                break;
            }

            // Runtime error (non-empty stderr but not compiler error)
            if (!glotResult.stdout && glotResult.stderr) {
                results.push({
                    index,
                    status: "Runtime Error",
                    input: tc.input,
                    expectedOutput,
                    output: normalizeJudgeText(glotResult.stderr),
                });
                break;
            }

            const actualOutput = normalizeJudgeText(glotResult.stdout);
            const isAccepted =
                expectedOutput === null ? true : expectedOutput === actualOutput;

            results.push({
                index,
                status: isAccepted ? "Accepted" : "Wrong Answer",
                input: tc.input,
                expectedOutput,
                output: actualOutput,
            });

            if (!isAccepted) break;
        }

        const overallStatus =
            results.find((r) => r.status !== "Accepted")?.status ?? "Accepted";

        return {
            status: overallStatus,
            output: results.length > 0 ? "Run completed." : "No test cases were provided.",
            results,
        };
    } catch (error) {
        console.error("Run Code Error:", error);
        return {
            status: "Runtime Error",
            output: `Execution error: ${error?.message || "Unknown error"}`,
            results: [],
        };
    }
};