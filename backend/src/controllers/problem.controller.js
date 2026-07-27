import Problem from '../models/problem.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {ApiError} from '../utils/ApiError.js';
import path from 'path';
import fs from 'fs';
import {ensureDirectoryExists, deleteDirectoryIfExists, extractZip, parseJSONSafe} from '../utils/fileSystem.js';

const createProblem = asyncHandler(async (req, res) => {
    try {
        const {title, slug, statement, inputFormat, outputFormat, constraints, sampleTestCases, timelimit, memorylimit, difficulty} = req.body;

        // check if all the fields are present
        if ([title, slug, statement, inputFormat, outputFormat, constraints, sampleTestCases, timelimit, memorylimit, difficulty].some(field => field === undefined)) {
            
            throw new ApiError(400, 'All fields are required');
        }

        // check if problem with the same slug already exists
        const existingProblem = await Problem.findOne({slug});
        if (existingProblem) {
            throw new ApiError(400, 'Problem with the same slug already exists');
        }
    
        //check if hidden test cases file is present
        if (!req.file) {
            throw new ApiError(400, 'Hidden test cases file is required');
        }
        
        // check if the zip file size is within the limit
        const zipFileSizeLimit = parseInt(process.env.TESTCASE_ZIP_SIZE_LIMIT) || 50 * 1024 * 1024; // default to 50MB if not set
        if (req.file.size > zipFileSizeLimit) {
            throw new ApiError(400, `Hidden test cases file size exceeds the limit of ${zipFileSizeLimit / (1024 * 1024)} MB`);
        }

        // create new problem
        const parsedSampleTestCases = parseJSONSafe(sampleTestCases);

        const newProblem = new Problem({
            title,
            slug,
            statement,
            inputFormat,
            outputFormat,
            constraints,
            sampleTestCases : parsedSampleTestCases,
            hiddenTestCasesPath : 'temp', // will be updated later after processing the uploaded file
            timelimit,
            memorylimit,
            difficulty,
            createdBy: req.user._id
        });

        await newProblem.save();
        let destinationPath ;
        try{
            // process the uploaded hidden test cases file
            destinationPath = path.join("storage", "testcases", newProblem._id.toString());
            extractZip(req.file.path, destinationPath);
        }
        catch (error) {
            // delete the problem if there was an error processing the test cases file
            deleteDirectoryIfExists(destinationPath);

            await Problem.findByIdAndDelete(newProblem._id);
            
            throw new ApiError(500, 'An error occurred while processing the hidden test cases file');
        }
        // update the problem with the path to the hidden test cases
        newProblem.hiddenTestCasesPath = destinationPath;
        await newProblem.save();

        res.status(201).json(new ApiResponse(201, 'Problem created successfully', newProblem));
    }
    catch (error) {
        throw new ApiError(500, 'An error occurred while creating the problem');
    }
    finally {
        // delete the uploaded zip file if it still exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
    
});

const getAllProblems = asyncHandler(async (req, res) => {
    //if user is admin, return all problems including archived ones, else return only active problems  
    const filter = req?.user?.role === 'admin' ? {} : {isActive: true};
    const problems = await Problem.find(filter).select("-hiddenTestCasesPath -createdBy -updatedAt ").sort({createdAt: -1});

    res.status(200)
    .json(new ApiResponse(
        200, 'Problems retrieved successfully', problems
    ));
});

const getProblemBySlug = asyncHandler(async (req, res) => {
    const {slug} = req.params;
    const problem = await Problem.findOne({slug}).select("-hiddenTestCasesPath -createdBy -updatedAt ");

    if (!problem || (!problem.isActive && req?.user?.role !== 'admin')) {
        throw new ApiError(404, 'Problem not found');
    }

    res.status(200)
    .json(new ApiResponse(
        200, 'Problem retrieved successfully', problem
    ));
});

const updateProblem = asyncHandler(async (req, res) => {
    // get the problem by id
    const {id} = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ApiError(404, 'Problem not found');
    }

    // Extract the fields to be updated from the request body
    const {title, statement, inputFormat, outputFormat, constraints, sampleTestCases, timelimit, memorylimit, difficulty} = req.body;
    // Atleast one field must be provided for update
    if ([title, statement, inputFormat, outputFormat, constraints, sampleTestCases, timelimit, memorylimit, difficulty].every(field => field === undefined)) {
        throw new ApiError(400, 'At least one field must be provided for update');
    }
    // Update the problem fields if they are provided in the request body
    if (title !== undefined && title !== "") problem.title = title;
    if (statement !== undefined &&  statement !=="") problem.statement = statement;
    if (inputFormat !== undefined) problem.inputFormat = inputFormat;
    if (outputFormat !== undefined) problem.outputFormat = outputFormat;
    if (constraints !== undefined) problem.constraints = constraints;
    if (sampleTestCases !== undefined) {
        const parsedSampleTestCases = parseJSONSafe(sampleTestCases);
        problem.sampleTestCases = parsedSampleTestCases;
    }
    if (timelimit !== undefined) problem.timelimit = timelimit;
    if (memorylimit !== undefined) problem.memorylimit = memorylimit;
    if (difficulty !== undefined) problem.difficulty = difficulty;
    
    
    // Save the updated problem
    await problem.save();

    res.status(200).json(new ApiResponse(200, 'Problem updated successfully', problem));
});

const updateProblemTestCases = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ApiError(404, 'Problem not found');
    }

    // check if hidden test cases file is present
    if (!req.file) {
        throw new ApiError(400, 'Hidden test cases file is required');
    }

    let destinationPath ;
    try{
        // process the uploaded hidden test cases file
        destinationPath = path.join("storage", "testcases", problem._id.toString());

        // extract the new test cases to a temporary location first
        const tempPath = path.join("storage", "temp", `${problem._id.toString()}_${Date.now()}`);
        ensureDirectoryExists(tempPath);
        extractZip(req.file.path, tempPath);

        // delete the old test cases directory if it exists
        deleteDirectoryIfExists(destinationPath);

        // move the new test cases from the temporary location to the final destination
        fs.renameSync(tempPath, destinationPath);
    }
    catch (error) {
        // delete the problem if there was an error processing the test cases file
        deleteDirectoryIfExists(destinationPath);

        throw new ApiError(500, 'An error occurred while processing the hidden test cases file');
    }
    finally {
        // delete the uploaded zip file if it still exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
    
    // update the problem with the path to the hidden test cases
    problem.hiddenTestCasesPath = destinationPath;
    await problem.save();

    res.status(200).json(new ApiResponse(200, 'Problem test cases updated successfully', problem));
});

const archiveProblem = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ApiError(404, 'Problem not found');
    }
    //check if the problem is already archived
    if (!problem.isActive) {
        throw new ApiError(400, 'Problem is already archived');
    }
    problem.isActive = false;
    await problem.save();

    res.status(200).json(new ApiResponse(200, 'Problem archived successfully', problem));
});

const unarchiveProblem = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ApiError(404, 'Problem not found');
    }
    //check if the problem is already active
    if (problem.isActive) {
        throw new ApiError(400, 'Problem is already active');
    }
    problem.isActive = true;
    await problem.save();

    res.status(200).json(new ApiResponse(200, 'Problem unarchived successfully', problem));
});
export {
    createProblem,
    getAllProblems,
    getProblemBySlug,
    updateProblem,
    updateProblemTestCases,
    archiveProblem,
    unarchiveProblem
};

    
