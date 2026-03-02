import mongoose from "mongoose";
import logger from "../config/logger";

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gestao-obra-server";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("MongoDB connection error", { error: err });
  });

export const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

export const getDbReadyState = (): number => mongoose.connection.readyState;

export const closeDbConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  }
};
