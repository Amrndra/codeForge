class ApiError extends Error {
    constructor(
        status, 
        message = "Something went wrong", 
        errors= [], 
        stack = ''
    ) {
        super(message);
        this.status = status;
        this.errors = errors;
        this.success = false;
        this.data = null;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};