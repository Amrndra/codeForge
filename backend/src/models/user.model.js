import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        unique: true,
        trim : true
    },
    fullName : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    }, 
    passwordHash : {
        type: String,
        required: true,
        select: false
    },
    role : {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }, 
    avatarUrl : {
        type: String,
        default: ''
    },
    refreshToken : {
        type: String,
        default: '',
        select: false
    }
}, { timestamps: true, versionKey: false });

userSchema.pre('save', async function() {
    if (!this.isModified('passwordHash')) {
        return ;
    }
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
}

userSchema.methods.generateAccessToken =  function() {
    return  jwt.sign(
        {
            userId: this._id,
            role: this.role,
            fullName: this.fullName,
            email: this.email
        },
        
        process.env.ACCESS_TOKEN_SECRET,
        { 
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN 
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            userId: this._id,
            email: this.email
        },
        process.env.REFRESH_TOKEN_SECRET,
        { 
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN 
        }
    );
}


const User = mongoose.model('User', userSchema);

export default User;