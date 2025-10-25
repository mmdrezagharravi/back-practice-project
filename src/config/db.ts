import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const connectDB = async (uri: string) => {
  if (!uri) {
    throw new Error("MONGO_URI is not defined in .env");
  }
  mongoose.set("strictQuery", true);

  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {});
      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      attempts++;
      console.error(`mongodb connection attempt : ${attempts} failed  :`, err);

      if (attempts < MAX_RETRIES) {
        console.log(`retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
      } else {
        console.error("culd not connect to mongoDB after maximum retries. ");
        process.exit(1);
      }
    }
  }
};
