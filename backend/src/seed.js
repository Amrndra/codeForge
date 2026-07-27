import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Problem from './models/problem.model.js';
import Contest from './models/contest.model.js';

dotenv.config();

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is missing.');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully.');

        // 1. Seed / Ensure Admin User
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
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

        // 2. Seed Problem: Two Sum
        let twoSum = await Problem.findOne({ slug: 'two-sum' });
        if (!twoSum) {
            console.log('Seeding problem: Two Sum...');
            twoSum = await Problem.create({
                title: 'Two Sum',
                slug: 'two-sum',
                statement: 'Given an array of integers nums and an integer target, return the 0-based indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
                inputFormat: 'First line contains integer N (number of elements) and integer target separated by a space.\nSecond line contains N space-separated integers.',
                outputFormat: 'Print the two 0-based indices separated by a space in ascending order.',
                constraints: '2 <= N <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
                sampleTestCases: [
                    {
                        input: '4 9\n2 7 11 15',
                        output: '0 1'
                    },
                    {
                        input: '3 6\n3 2 4',
                        output: '1 2'
                    }
                ],
                hiddenTestCasesPath: 'temp',
                timelimit: 1000,
                memorylimit: 256,
                difficulty: 'Easy',
                createdBy: admin._id
            });
            console.log('Problem "Two Sum" seeded successfully.');
        } else {
            console.log('Problem "Two Sum" already exists.');
        }

        // 3. Seed Problem: Sum of All Integers
        let sumIntegers = await Problem.findOne({ slug: 'sum-of-all-integers' });
        if (!sumIntegers) {
            console.log('Seeding problem: Sum of All Integers...');
            sumIntegers = await Problem.create({
                title: 'Sum of All Integers',
                slug: 'sum-of-all-integers',
                statement: 'Given an array of N integers, calculate and return the sum of all elements in the array.',
                inputFormat: 'First line contains an integer N.\nSecond line contains N space-separated integers.',
                outputFormat: 'Print a single integer representing the total sum of all elements.',
                constraints: '1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9',
                sampleTestCases: [
                    {
                        input: '5\n1 2 3 4 5',
                        output: '15'
                    },
                    {
                        input: '4\n-1 5 10 -4',
                        output: '10'
                    }
                ],
                hiddenTestCasesPath: 'temp',
                timelimit: 1000,
                memorylimit: 256,
                difficulty: 'Easy',
                createdBy: admin._id
            });
            console.log('Problem "Sum of All Integers" seeded successfully.');
        } else {
            console.log('Problem "Sum of All Integers" already exists.');
        }

        // 4. Seed / Ensure Contest
        let contest = await Contest.findOne({ title: 'Introductory Contest' });
        if (!contest) {
            console.log('Seeding sample contest...');
            const startTime = new Date();
            const endTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

            contest = await Contest.create({
                title: 'Introductory Contest',
                description: 'A starter contest featuring Two Sum and Sum of All Integers.',
                problems: [
                    {
                        problem: twoSum._id,
                        points: 100
                    },
                    {
                        problem: sumIntegers._id,
                        points: 100
                    }
                ],
                penaltyPerWrongSubmission: 20,
                startTime,
                endTime,
                createdBy: admin._id,
                isPublic: true
            });
            console.log('Sample contest seeded successfully.');
        } else {
            console.log('Sample contest already exists.');
        }

        console.log('✅ All seed data inserted / verified successfully!');
    } catch (error) {
        console.error('❌ Error during database seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

seed();
