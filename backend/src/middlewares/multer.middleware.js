import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

// Allow only image files
const fileFilterAvatar = (req, file, cb) => {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith('image/') && allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only image files are allowed'), false);
    }
}

const destinationPathAvatar = path.join('public', 'avatars');

const storageAvatar = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the destination directory exists
        if (!fs.existsSync(destinationPathAvatar)) {
            fs.mkdirSync(destinationPathAvatar, { recursive: true });
        }
        cb(null, destinationPathAvatar);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, req.user._id + Date.now() + ext);
}

});

const uploadAvatar = multer({ 
    storage : storageAvatar, 
    fileFilter: fileFilterAvatar, 
    limits: {
        fileSize: 2 * 1024 * 1024
    } })
    .single('avatar');


// multer middleware for problem test case file upload

const fileFilterTestCases = (req, file, cb) => {
    const allowedExts = ['.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if ( allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only zip files are allowed'), false);
    }
}

const destinationPathTestCases = path.join('storage', 'temp');

const storageTestCases = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the destination directory exists
        if (!fs.existsSync(destinationPathTestCases)) {
            fs.mkdirSync(destinationPathTestCases, { recursive: true });
        }
        cb(null, destinationPathTestCases);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Math.random() + '-' + Date.now() + ext);
    }
});

const uploadTestCases = multer({ 
    storage: storageTestCases, 
    fileFilter: fileFilterTestCases, 
    limits: {
        fileSize: 50 * 1024 * 1024
    } })
    .single('testcases');

export {
    uploadAvatar,
    uploadTestCases
}