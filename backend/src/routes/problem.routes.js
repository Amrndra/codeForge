import { Router } from "express";

import { createProblem, 
        getAllProblems,
        getProblemBySlug,
        updateProblem,
        updateProblemTestCases,
        archiveProblem,
        unarchiveProblem } from "../controllers/problem.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { adminCheck } from "../middlewares/adminCheck.middleware.js";
import { uploadTestCases } from "../middlewares/multer.middleware.js";

const router = Router();

//public routes
router.get('/all',optionalVerifyJWT, getAllProblems);
router.get('/:slug',optionalVerifyJWT, getProblemBySlug);

//secure routes 
router.post('/create', verifyJWT, adminCheck, uploadTestCases, createProblem);
router.patch('/:id', verifyJWT, adminCheck, updateProblem);
router.patch('/:id/testcases', verifyJWT, adminCheck, uploadTestCases, updateProblemTestCases);
router.patch('/:id/archive', verifyJWT, adminCheck, archiveProblem);
router.patch('/:id/unarchive', verifyJWT, adminCheck, unarchiveProblem);
export default router;