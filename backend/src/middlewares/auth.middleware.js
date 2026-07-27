import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import User from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.header("Authorization") || req.headers?.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    // Check if token exists
    if (!token) {
        throw new ApiError(401,"Unauthorized");
    }
    let decoded = null;
    try {
        // Verify access token
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    }
    catch (err) {
        throw new ApiError(401, 'Invalid or expired token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
        throw new ApiError(401, 'Unauthorized: User not found');
    }
    req.user = user; // Attach user to request object
    next();
});

const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.header("Authorization") || req.headers?.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
        return next(); // No token, proceed without authentication
    }
    let decoded = null;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    }
    catch (err) {
        return next(); // Invalid token, proceed without authentication
    }

    const user = await User.findById(decoded.userId);
    if (user) {
        req.user = user; // Attach user to request object if found
    }
    next();
});

const verifyAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Forbidden: Admins only");
    }
    next();
});

export {verifyJWT, optionalVerifyJWT, verifyAdmin};
