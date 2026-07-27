import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import {ApiError} from './ApiError.js';

export const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {
            recursive: true
        });
    }
};

export const deleteFileIfExists = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const deleteDirectoryIfExists = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, {
            recursive: true,
            force: true
        });
    }
};

export const extractZip = (
    zipFilePath,
    destinationPath
) => {

    try {

        const zip = new AdmZip(zipFilePath);        
        const entries = zip.getEntries();

        if (entries.length > 2*parseInt(process.env.TESTCASES_PER_PROBLEM_LIMIT)) {
            throw new ApiError(400, "Too many files in ZIP");
        }

        let totalSize = 0;

        for (const entry of entries) {
            if (!entry.isDirectory) {
                totalSize += entry.header.size;

                if (totalSize > parseInt(process.env.TESTCASE_ZIP_SIZE_LIMIT)) {
                    throw new ApiError(400, "Extracted size too large");
                }
            }
        }

        if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, {
                recursive: true
            });
        }

        // Detect a common top-level directory prefix to strip it.
        // e.g. if all entries start with "testcases/" we strip that prefix
        // so files land directly in destinationPath/.
        const firstEntry = entries[0];
        const topLevelPrefix = firstEntry
            ? firstEntry.entryName.split('/')[0] + '/'
            : null;
        const hasCommonPrefix =
            topLevelPrefix &&
            entries.every(e => e.entryName.startsWith(topLevelPrefix));

        for (const entry of entries) {
            // Strip the common top-level prefix if present
            const relativePath = hasCommonPrefix
                ? entry.entryName.slice(topLevelPrefix.length)
                : entry.entryName;

            if (!relativePath) continue; // skip the root folder entry itself
            const resolvedPath = path.resolve(destinationPath, relativePath);

            if (!resolvedPath.startsWith(path.resolve(destinationPath))) {
                throw new ApiError(400, "Invalid file path in ZIP");
            }

            const targetPath = path.join(destinationPath, relativePath);

            if (entry.isDirectory) {
                fs.mkdirSync(targetPath, { recursive: true });
            } else {
                // Ensure parent directories exist
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.writeFileSync(targetPath, entry.getData());
            }
        }

    }
    catch (error) {

        if (
            destinationPath &&
            fs.existsSync(destinationPath)
        ) {
            fs.rmSync(destinationPath, {
                recursive: true,
                force: true
            });
        }

        throw new ApiError(
            500,
            `ZIP extraction failed: ${error.message}`
        );
    }
};

export const parseJSONSafe = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        throw new ApiError(400, 'Invalid JSON format');
    }
};

