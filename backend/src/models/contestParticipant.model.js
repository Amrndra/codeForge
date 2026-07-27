import mongoose from 'mongoose';

const contestParticipantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    penalty: {
        type: Number,//seconds
        default: 0
    },
    solvedProblems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }]
}, { timestamps: true, versionKey: false });

// Ensure that a user can only participate in a contest once
contestParticipantSchema.index(
    { user: 1, contest: 1 },
    { unique: true }
);

const ContestParticipant = mongoose.model('ContestParticipant', contestParticipantSchema);

export default ContestParticipant;