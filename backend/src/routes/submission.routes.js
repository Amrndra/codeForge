import { Router } from "express";
import { 
    submitSolution,
    getSubmission,
    getMySubmissions,
    runCodeInWorker,
    getRunCodeResult
} from "../controllers/submission.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { adminCheck } from "../middlewares/adminCheck.middleware.js";

const router = Router();

router.get('/my-submissions', verifyJWT, getMySubmissions);
router.post('/run', verifyJWT, runCodeInWorker);
router.get('/run/:jobId', verifyJWT, getRunCodeResult);
router.get('/:submissionId', verifyJWT, getSubmission); 

router.post('/submit', verifyJWT, submitSolution);

export default router;