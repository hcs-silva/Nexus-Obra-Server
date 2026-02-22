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
