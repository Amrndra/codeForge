import mongoose from 'mongoose';
import {ApiResponse} from '../utils/ApiResponse.js';
import {ApiError} from '../utils/ApiError.js';
const problemSchema = new mongoose.Schema({
    title : {
        type: String,
        required: true
    }, 
    slug : {
        type: String,
        required: true,
        unique: true,
    }, 
    statement : {
        type: String,
        required: true
    }, 
    inputFormat : {
        type: String,
        required: true
    }, 
    outputFormat : {
        type: String,
        required: true,
    },
    constraints : {
        type: String,
        required: true
    },
    sampleTestCases : [
        {
            input : {
                type: String,
                required: true
            },
            output : {
                type: String,
                required: true
            }
        }
    ],
    hiddenTestCasesPath: {
        type: String,
        required: true
    },
    timelimit : {
        type: Number, // ms
        required: [true, 'Time limit is required'],
        min : [100, 'Time limit must be at least 100 ms'],
        max : [10000, 'Time limit must be at most 10000 ms'],
        validate : {
            validator : Number.isInteger,
            message : 'Time limit must be an integer'
        }
    },
    memorylimit : {
        type: Number,
        required: [true, 'Memory limit is required'],
        min : [128, "Memory limit must be at least 128 MB"], // MB
        max : [ 1024, "Memory limit must be at most 1024 MB"],
        validate : {
            validator : Number.isInteger,
            message : 'Memory limit must be an integer'
        }
    },
    difficulty : {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required: true
    },
    isActive : {
        type: Boolean,
        default: true
    }
}, {timestamps: true, versionKey: false});

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;