import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Use REDIS_URL if defined; otherwise fall back to REDIS_HOST + REDIS_PORT
const redisConnection = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
    };

const redis = new Redis(
    redisConnection,
    {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    }
);

// console.log(redis.options);

export default redis;