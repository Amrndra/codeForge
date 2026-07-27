import User from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { options } from '../constants/cookieOptions.js';
import path from 'path';
import fs from 'fs';
import ContestParticipant from '../models/contestParticipant.model.js';
import Submission from '../models/submission.model.js';

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    })
    if (existingUser) {
        throw new ApiError(400, 'User already exists with this email or username');
    }
    // Check if all fields are provided
    if ([username, fullName, email, password].some(field => !field?.trim())) {
        throw new ApiError(400, 'All fields are required');
    }
    // Create new user
    const newUser = new User({
        username,
        fullName,
        email,
        avatarUrl: "avatars/default-avatar.png",
        passwordHash: password
    });
    //Save user to database
    await newUser.save();

    //generate tokens
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();
    // Save refresh token to database
    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    // Send response with tokens and user data
    const userData = await User.findById(newUser._id);
    res.status(201)
        .json(new ApiResponse(201, 'User registered successfully', {
            token: accessToken,
            accessToken,
            refreshToken,
            user: userData
        }));
});

const loginUser = asyncHandler(async (req, res) => {
    let { identifier, password } = req.body;
    identifier = identifier?.trim();
    // Validate input
    if (!identifier) {
        throw new ApiError(400, 'Email or username is required');
    }
    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    // Check if user exists
    const user = await User.findOne({
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    }).select('+passwordHash +refreshToken');
    if (!user) {
        throw new ApiError(400, 'Invalid email/username or password');
    }
    //Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid email/username or password');
    }
    // generate access token
    const accessToken = user.generateAccessToken();
    // generate refresh token
    const refreshToken = user.generateRefreshToken();
    // Save refresh token to database
    user.refreshToken = refreshToken;
    //Save user with refresh token
    await user.save({ validateBeforeSave: false });

    // Send response with tokens and user data
    const userData = await User.findById(user._id).select('-passwordHash -refreshToken');
    res.status(200)
        .json(new ApiResponse(200, 'Login successful', {
            token: accessToken,
            accessToken,
            refreshToken,
            user: userData
        }));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;
    res.status(200).json(new ApiResponse(200, 'Current user retrieved successfully', user));
});

const rotateTokens = asyncHandler(async (req, res) => {
    const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'] || req.cookies?.refreshToken;
    if (!refreshToken) {
        throw new ApiError(401, 'Unauthorized');
    }
    // Verify refresh token and get user
    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Unauthorized');
    }
    // Find user by ID and check if refresh token matches
    const user = await User.findById(payload.userId).select('+refreshToken');
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }
    if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Unauthorized');
    }
    // Generate new access token
    const accessToken = user.generateAccessToken();
    // Generate new refresh token
    const newRefreshToken = user.generateRefreshToken();
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    // Send response with new tokens
    res.status(200)
        .json(new ApiResponse(200, 'Tokens rotated successfully', {
            token: accessToken,
            accessToken,
            refreshToken: newRefreshToken,
            user
        }));
});

const logoutUser = asyncHandler(async (req, res) => {
    const user = req.user;
    if (user) {
        // Clear refresh token from database
        user.refreshToken = "";
        await user.save({ validateBeforeSave: false });
    }
    res.status(200)
        .json(new ApiResponse(200, 'Logout successful'));
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    const { fullName, email, username } = req.body;
    // Update user fields if provided
    if (fullName?.trim()) user.fullName = fullName.trim();
    if (email?.trim()) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingUser) {
            throw new ApiError(400, 'Email is already taken');
        }
        user.email = email.trim();
    }
    if (username?.trim()) {
        // Check if username is already taken by another user
        const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
        if (existingUser) {
            throw new ApiError(400, 'Username is already taken');
        }
        user.username = username.trim();
    }
    // Save updated user to database
    await user.save();
    // Send response with updated user data
    const updatedUserData = await User.findById(user._id);
    res.status(200).json(new ApiResponse(200, 'User profile updated successfully', updatedUserData));
});

const updateUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+passwordHash +refreshToken');
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword?.trim() || !newPassword?.trim()) {
        throw new ApiError(400, 'Current password and new password are required');
    }
    // Check if current password is correct
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw new ApiError(400, 'Current password is incorrect');
    }
    // check if new password is different from current password
    if (currentPassword === newPassword) {
        throw new ApiError(400, 'New password must be different from current password');
    }
    // Update password
    user.passwordHash = newPassword;

    // set new refresh token to invalidate old tokens
    const newRefreshToken = user.generateRefreshToken();
    user.refreshToken = newRefreshToken;

    // get new access token
    const newAccessToken = user.generateAccessToken();

    await user.save();;

    // Clear old refresh token cookie and set new one
    res.status(200)
        .json(new ApiResponse(200, 'Password updated successfully', {
            token: newAccessToken,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
    }
    const oldAvatarPath = user.avatarUrl ? path.join('public', user.avatarUrl) : null;
    // Update user's avatar path
    user.avatarUrl = path.join('avatars', req.file.filename);
    await user.save();

    // delete old avatar file if it exists and is not the default avatar
    if (oldAvatarPath && fs.existsSync(oldAvatarPath) && !oldAvatarPath.includes('default-avatar.png')) {
        fs.unlinkSync(oldAvatarPath);
    }

    res.status(200).json(new ApiResponse(200, 'Avatar updated successfully', {
        avatarUrl: user.avatarUrl
    }));
});

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-passwordHash -refreshToken');
    res.status(200).json(new ApiResponse(200, 'Users retrieved successfully', users));
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+passwordHash +refreshToken');
    const { password } = req.body;
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid password');
    }

    // remove contest Participation and submissions 
    await ContestParticipant.deleteMany({ user: user._id });
    await Submission.deleteMany({ user: user._id });
    // remove user's avatar
    if (user.avatarUrl) {
        const avatarPath = path.join('public', user.avatarUrl);
        if (fs.existsSync(avatarPath) && !avatarPath.includes('default-avatar.png')) {
            fs.unlinkSync(avatarPath);
        }
    }
    await user.deleteOne();
    res
        .status(200)
        .json(new ApiResponse(200, 'User deleted successfully'));
});

export {
    registerUser,
    loginUser,
    getCurrentUser,
    rotateTokens,
    logoutUser,
    updateUserProfile,
    updateUserPassword,
    updateUserAvatar,
    getUsers,
    deleteUser
};