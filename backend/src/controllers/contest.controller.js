import Contest from '../models/contest.model.js';
import Problem from '../models/problem.model.js';
import ContestParticipant from '../models/contestParticipant.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createContest = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        problems,
        penaltyPerWrongSubmission,
        startTime,
        endTime,
        isPublic
    } = req.body;

    // Validate required fields
    if (
        [
            title,
            description,
            problems,
            penaltyPerWrongSubmission,
            startTime,
            endTime,
        ].some(field => field === undefined)
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    const problemIds = problems.map(p => p.problem);

    // Verify if all problems exist and are active
    const validProblems = await Problem.find({
        _id: { $in: problemIds },
        isActive: true,
    });

    if (validProblems.length !== problemIds.length) {
        throw new ApiError(
            400,
            'One or more problems are invalid or inactive'
        );
    }

    const createdBy = req.user._id;

    const contest = new Contest({
        title,
        description,
        problems,
        penaltyPerWrongSubmission,
        startTime,
        endTime,
        createdBy,
        isPublic,
    });

    await contest.save();

    res.status(201).json(
        new ApiResponse(
            201,
            'Contest created successfully',
            contest
        )
    );
});

const getContests = asyncHandler(async (req, res) => {

    let filter = { isPublic: true };

    if (req?.user?.role === 'admin') {
        filter = {};
    }

    const contests = await Contest.find(filter)
        .sort({ createdAt: -1 })
        .select(
            'title startTime endTime isPublic penaltyPerWrongSubmission'
        ).lean()

    // add isRegistered field to each contest based on req.user._id
    const userContests = await ContestParticipant.find({
        user: req.user?._id
    }).select('contest');

    const registeredContestIds = userContests.map(uc => uc.contest.toString());

    const contestsWithRegistrationStatus = contests.map(contest => ({
        ...contest,
        isRegistered: registeredContestIds.includes(contest._id.toString())
    }));

    res.status(200).json(
        new ApiResponse(
            200,
            'Contests retrieved successfully',
            contestsWithRegistrationStatus
        )
    );
});

const getContestById = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const contest = await Contest.findById(id).populate({
        path: 'problems.problem',
        select: 'title difficulty slug isActive',
    });

    if (
        !contest ||
        (!contest.isPublic && req?.user?.role !== 'admin')
    ) {
        throw new ApiError(404, 'Contest not found');
    }

    if (
        new Date() < contest.startTime &&
        req?.user?.role !== 'admin'
    ) {
        throw new ApiError(
            403,
            'Contest has not started yet'
        );
    }

    if (req.user.role !== "admin") {

        const registered = await ContestParticipant.exists({
            user: req.user._id,
            contest: contest._id
        });

        if (!registered) {
            throw new ApiError(
                403,
                "You are not registered for this contest"
            );
        }
    }

    res.status(200).json(
        new ApiResponse(
            200,
            'Contest retrieved successfully',
            contest
        )
    );
});

const updateContest = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const {
        title,
        description,
        problems,
        penaltyPerWrongSubmission,
        startTime,
        endTime,
        isPublic,
    } = req.body;

    if (
        [
            title,
            description,
            problems,
            penaltyPerWrongSubmission,
            startTime,
            endTime,
            isPublic,
        ].every(field => field === undefined)
    ) {
        throw new ApiError(
            400,
            'At least one field is required to update'
        );
    }

    if (problems !== undefined) {

        const problemIds = problems.map(
            p => p.problem
        );

        const validProblems = await Problem.find({
            _id: { $in: problemIds },
            isActive: true,
        });

        if (validProblems.length !== problemIds.length) {
            throw new ApiError(
                400,
                'One or more problems are invalid or inactive'
            );
        }
    }

    const contest = await Contest.findById(id);

    if (!contest) {
        throw new ApiError(
            404,
            'Contest not found'
        );
    }

    if (new Date() >= contest.startTime) {
        throw new ApiError(
            403,
            'Cannot update a contest that has already started'
        );
    }

    if (title !== undefined)
        contest.title = title;

    if (description !== undefined)
        contest.description = description;

    if (problems !== undefined)
        contest.problems = problems;

    if (penaltyPerWrongSubmission !== undefined)
        contest.penaltyPerWrongSubmission =
            penaltyPerWrongSubmission;

    if (startTime !== undefined)
        contest.startTime = startTime;

    if (endTime !== undefined)
        contest.endTime = endTime;

    if (isPublic !== undefined)
        contest.isPublic = isPublic;

    await contest.save();

    res.status(200).json(
        new ApiResponse(
            200,
            'Contest updated successfully',
            contest
        )
    );
});

const deleteContest = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const contest = await Contest.findById(id);

    if (!contest) {
        throw new ApiError(
            404,
            'Contest not found'
        );
    }

    if (
        new Date() >= contest.startTime &&
        new Date() < contest.endTime
    ) {
        throw new ApiError(
            403,
            'Cannot delete a contest that is currently running'
        );
    }

    await contest.deleteOne();

    res.status(200).json(
        new ApiResponse(
            200,
            'Contest deleted successfully'
        )
    );
});

export {
    createContest,
    getContests,
    getContestById,
    updateContest,
    deleteContest,
};