console.log('Starting express backend server...');

import connectDB from "./db/index.js";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
    .then(async () => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // In production (Render), start the workers in-process because
        // there is no separate worker dyno. Locally, workers run via `npm run worker`.
        if (process.env.NODE_ENV === 'production') {
            console.log('Production mode: starting in-process workers...');
            await import('./worker/judge.worker.js');
            await import('./worker/run.worker.js');
            console.log('In-process workers started.');
        }
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err);
        process.exit(1);
    });