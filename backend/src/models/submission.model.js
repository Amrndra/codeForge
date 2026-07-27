import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    contest :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        default: null
    },
    language : {
        type: String,
        required: true,
        enum: ['C++', 'Java', 'Python']
    },
    code : {
        type: String,
        required: true,
        maxlength: 100000 // 100 KB
    },
    status : {
        type: String,
        enum: [
            'Pending',
            'Judging',
            'Completed',
            'Failed'
        ],
        default: 'Pending'
    },
    verdict : {
        type: String,        
        enum: [
            'Accepted',
            'Wrong Answer',
            'Time Limit Exceeded',
            'Runtime Error',
            'Compilation Error',
            'Memory Limit Exceeded'
        ],
        default: null
    },
    executionTime : {
        type: Number,
        default: null
    },
    memoryUsed : {
        type: Number,
        default: null
    }
}, {timestamps: true, versionKey: false});

submissionSchema.index({
    user: 1,
    submittedAt: -1
});

submissionSchema.index({
    problem: 1
});

submissionSchema.index({
    contest: 1
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;