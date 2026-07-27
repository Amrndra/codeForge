const errorHandler = (err, req, res, next) => {
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {

        const validationErrors = {};

        Object.keys(err.errors).forEach((key) => {
            validationErrors[key] = err.errors[key].message;
        });

        return res.status(400).json({
            statusCode: 400,
            success: false,
            message: 'Validation failed',
            errors: validationErrors,
            data: null
        });
    }

    // Handling CastError (e.g., invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            statusCode: 400,
            success: false,
            message: `Invalid resource ID: ${err.value}`,
            errors: [],
            data: null
        });
    }
    const statusCode = err.status || 500;

    return res.status(statusCode).json({
        statusCode,
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        data: null
    });
};

export default errorHandler;