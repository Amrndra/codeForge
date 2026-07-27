import express from "express";
import cors from "cors";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'https://compile-x-mu.vercel.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            allowedOrigins.includes('*') ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')
        ) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy error: Origin ${origin} not allowed`), false);
    },
    credentials: true,
}))

app.use(express.json({
    limit: "16kb"
})); //for forms

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
})); //for url params

//limit is set to 16kb to prevent large payloads, which can help mitigate certain types of attacks and reduce server load.

app.use(express.static("public")); //for static files ie serve files from backend/public


//routes import 

import userRouter from "./routes/user.routes.js";
import problemRouter from "./routes/problem.routes.js";
import contestRouter from "./routes/contest.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import adminRouter from "./routes/admin.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/problems", problemRouter);
app.use("/api/v1/contests", contestRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/admin", adminRouter);

//error handling middleware
import errorHandler from "./middlewares/error.middleware.js";
app.use(errorHandler);

export default app;