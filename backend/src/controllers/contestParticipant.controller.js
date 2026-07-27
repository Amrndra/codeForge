import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ContestParticipant from '../models/contestParticipant.model.js';
import Contest from '../models/contest.model.js';

const registerForContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const userId = req.user._id;
    // Check if the contest exists and is public
    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isPublic) {
        throw new ApiError(404, 'Contest not found');
    }

    // Check if the contest has ended
    if (new Date() > contest.endTime) {
        throw new ApiError(400, 'Contest has already ended');
    }
    // Check if the user is already registered for the contest
    const existingParticipant = await ContestParticipant.findOne({ contest: contestId, user: userId });
    if (existingParticipant) {
        throw new ApiError(400, 'User is already registered for this contest');
    }

    const participant = new ContestParticipant({ contest: contestId, user: userId });
    await participant.save();

    res.status(201).json(new ApiResponse(201, 'Registered for contest successfully', participant));
});


const deleteContestParticipant = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const userId = req.user._id;

    // Check if the contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) {
        throw new ApiError(404, 'Contest not found');
    }

    // Check if the user is registered for the contest
    const participant = await ContestParticipant.findOne({ contest: contestId, user: userId });
    if (!participant) {
        throw new ApiError(404, 'User is not registered for this contest');
    }

    // check if the conest has started
    if (new Date() >= contest.startTime) {
        throw new ApiError(400, 'Contest has already started, cannot unregister');
    }

    await participant.deleteOne();

    res.status(200).json(new ApiResponse(200, 'Unregistered from contest successfully'));
});

const getLeaderboard = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const contest = await Contest.findById(contestId);
    if (!contest) {
        throw new ApiError(404, 'Contest not found');
    }
    const participants = await ContestParticipant
        .find({ contest: contestId })
        .populate("user", "username avatar")
        .sort({ score: -1, penalty: 1 });

    // sort by higher score and lower time + penalty
    participants.sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;

        if (a.penalty !== b.penalty)
            return a.penalty - b.penalty;

        // Earlier solve time wins
        return a.updatedAt - b.updatedAt;
    });

    // on current user, tag that user by adding  isCurrentUser boolean

    const userId = req.user._id;
    const leaderboard = participants.map((participant, index) => ({
        _id: participant.user._id,
        rank: index + 1,
        username: participant.user.username,
        avatar: participant.user.avatar,
        solved: participant.solvedProblems.length,
        score: participant.score,
        penalty: participant.penalty,
        isCurrentUser: participant.user._id.equals(req.user._id)
    }));

    res.status(200).json(new ApiResponse(200, 'Leaderboard fetched successfully', leaderboard));
});

export {
    registerForContest,
    deleteContestParticipant,
    getLeaderboard
};