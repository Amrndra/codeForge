// middleware to check if the user is an admin
import {ApiError} from "../utils/ApiError.js";

const adminCheck = (req, res, next) => {
    if (!req.user) {
        return next(
            new ApiError(401, 'Unauthorized')
        );
    }

    if (req.user.role !== 'admin') {
        return next(
            new ApiError(403, 'Only admins can perform this action')
        );
    }
    next();
};

export {adminCheck};