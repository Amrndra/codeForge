import { Router } from "express";
import {
    createContest,
    getContests,
    getContestById,
    updateContest,
    deleteContest
} from "../controllers/contest.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { adminCheck } from "../middlewares/adminCheck.middleware.js";

const router = Router();
//public routes
router.get('/', optionalVerifyJWT, getContests);
router.get('/:id', verifyJWT, getContestById);
//secure routes 
router.post('/create', verifyJWT, adminCheck, createContest);
router.patch('/:id', verifyJWT, adminCheck, updateContest);
router.delete('/:id', verifyJWT, adminCheck, deleteContest);


// contest participant routes
import { registerForContest, deleteContestParticipant, getLeaderboard } from "../controllers/contestParticipant.controller.js";

router.post('/:contestId/register', verifyJWT, registerForContest);
router.delete('/:contestId/unregister', verifyJWT, deleteContestParticipant);
router.get('/:contestId/leaderboard', verifyJWT, getLeaderboard);


// submission routes
import { submitSolution } from "../controllers/submission.controller.js";

router.post('/:contestId/submit', verifyJWT, submitSolution);

export default router;