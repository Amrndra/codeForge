import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Contest from "../models/contest.model.js";
import ContestParticipant from "../models/contestParticipant.model.js";
import Submission from "../models/submission.model.js";

const updateContestParticipant = async (submissionId, contestId, contestParticipantId) => {

    const contest = await Contest.findById(contestId);
    if(!contest) {
        throw new ApiError(404, "Contest not found.");
    }

    const participant = await ContestParticipant.findById(contestParticipantId);

    if (!participant) {
        throw new ApiError(404, "Contest participant not found.");
    }
    
    const penaltyPerWrongSubmission = contest.penaltyPerWrongSubmission; // in minutes

    // Update the participant's score based on the submission result
    const submission = await Submission.findById(submissionId)
    if (!submission) {
        throw new ApiError(404, "Submission not found.");
    }

    const problemId = submission.problem;
    const verdict = submission.verdict;
    const status = submission.status;

    if(status !== "Completed") {
        // If the submission is not completed, we don't update the score
        return;
    }

    if(verdict === "Compilation Error" ) return ;

    const problemInContest = contest.problems.find(
        p => p.problem.equals(problemId)
    );
    if (!problemInContest) {
        throw new ApiError(404, "Problem not found in contest.");
    }

    const points = problemInContest.points;
    const alreadySolved = participant.solvedProblems.some(id =>
        id.equals(problemId)
    );

    if(alreadySolved) {
        // If the problem was already solved, we don't update the score
        return;
    }

    if (verdict === "Accepted") {
        participant.score += points;
        participant.solvedProblems.push(problemId);
    } else if (
        verdict === "Wrong Answer" ||
        verdict === "Runtime Error" ||
        verdict === "Time Limit Exceeded" ||
        verdict === "Memory Limit Exceeded"
    ) {
        participant.penalty += penaltyPerWrongSubmission;
    }

    await participant.save();
    
}

export { updateContestParticipant };