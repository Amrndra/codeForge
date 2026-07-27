import mongoose, { version } from 'mongoose';
import {ApiError} from '../utils/ApiError.js';
const contestSchema = new mongoose.Schema({
    title : {
        type: String,
        required: true
    },
    description : {
        type: String,
        required: true
    }, 
    problems : {
        type : [
            {
                problem : {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Problem',
                    required: true
                },
                points : {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ],
        validate : [
            {
                validator: (value)=> value.length > 0,
                message: 'A contest must have at least one problem.'
            },
            {
                validator : (value) => {
                    const uniqueProblems = new Set(value.map(String));
                    return uniqueProblems.size === value.length;
                },
                message: 'Problems in a contest must be unique.'
            }
        ]
    }
    ,
    penaltyPerWrongSubmission : {
        type: Number, //minutes
        required: true,
        min: 0
    },
    startTime : {
        type: Date,
        required: true
    },
    endTime : {
        type: Date,
        required: true
    },
    createdBy : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic : {
        type: Boolean,
        default: true
    }
},{timestamps: true, versionKey: false});

contestSchema.pre('validate', async function() {
    if (this.startTime >= this.endTime) {
        throw new ApiError(400, 'Start time must be before end time.');
    }
});

const Contest = mongoose.model('Contest', contestSchema);

export default Contest;