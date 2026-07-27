import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from '../src/models/problem.model.js';
import connectDB from '../src/db/index.js';
dotenv.config();

const difficulties = ['Easy', 'Medium', 'Hard'];

const generateProblems = () => {
    const problems = [];

    for (let i = 1; i <= 100; i++) {
        problems.push({
            title: `Problem ${i}`,
            slug: `problem-${i}`,
            statement: `Solve problem ${i}`,
            inputFormat: 'First line contains n',
            outputFormat: 'Print answer',
            constraints: '1 <= n <= 1000',
            sampleTestCases: [
                {
                    input: '3\n1 2 3',
                    output: '6'
                }
            ],
            hiddenTestCasesPath: `storage/testcases/problem-${i}`,
            timelimit: 200,
            memorylimit: 512,
            difficulty: difficulties[i % 3],
            createdBy: '6a044070b68785235662a871',
            isActive: true
        });
    }

    return problems;
};

const seedProblems = async () => {
    try {
        await connectDB();

        const problems = generateProblems();

        await Problem.insertMany(problems);

        console.log('100 problems inserted successfully');

        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedProblems();