import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Problem from './models/problem.model.js';
import Contest from './models/contest.model.js';

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected successfully.');

        // 1. Seed Admin User
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Seeding admin user...');
            admin = await User.create({
                username: 'admin',
                fullName: 'System Admin',
                email: 'admin@codeforge.dev',
                passwordHash: 'password123',
                role: 'admin'
            });
            console.log('Admin user seeded.');
        } else {
            console.log('Admin user already exists.');
        }

        // 2. Seed Problem
        let problem = await Problem.findOne({ slug: 'sum-of-array' });
        if (!problem) {
            console.log('Seeding sample problem...');
            problem = await Problem.create({
                title: 'Sum of Array',
                slug: 'sum-of-array',
                statement: 'Given an array of integers, find the sum of its elements.',
                inputFormat: 'First line contains integer N. Second line contains N space-separated integers.',
                outputFormat: 'Print the sum of the array elements.',
                constraints: '1 <= N <= 1000\n-10^9 <= A[i] <= 10^9',
                sampleTestCases: [
                    {
                        input: '3\n1 2 3',
                        output: '6'
                    }
                ],
                hiddenTestCasesPath: 'temp',
                timelimit: 1000,
                memorylimit: 256,
                difficulty: 'Easy',
                createdBy: admin._id
            });
            console.log('Sample problem seeded.');
        } else {
            console.log('Sample problem already exists.');
        }

        // 3. Seed Contest
        let contest = await Contest.findOne({ title: 'Introductory Contest' });
        if (!contest) {
            console.log('Seeding sample contest...');
            const startTime = new Date();
            const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            contest = await Contest.create({
                title: 'Introductory Contest',
                description: 'A simple starter contest to test the platform.',
                problems: [
                    {
                        problem: problem._id,
                        points: 100
                    }
                ],
                penaltyPerWrongSubmission: 20,
                startTime,
                endTime,
                createdBy: admin._id,
                isPublic: true
            });
            console.log('Sample contest seeded.');
        } else {
            console.log('Sample contest already exists.');
        }

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Error during database seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

seed();
