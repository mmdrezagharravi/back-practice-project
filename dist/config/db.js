"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const connectDB = async (uri) => {
    if (!uri) {
        throw new Error("MONGO_URI is not defined in .env");
    }
    mongoose_1.default.set("strictQuery", true);
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            await mongoose_1.default.connect(uri, {});
            console.log("✅ MongoDB connected");
            return;
        }
        catch (err) {
            attempts++;
            console.error(`mongodb connection attempt : ${attempts} failed  :`, err);
            if (attempts < MAX_RETRIES) {
                console.log(`retrying in ${RETRY_DELAY / 1000}s...`);
                await new Promise((res) => setTimeout(res, RETRY_DELAY));
            }
            else {
                console.error("culd not connect to mongoDB after maximum retries. ");
                process.exit(1);
            }
        }
    }
};
exports.connectDB = connectDB;
