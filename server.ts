import app from "./app";
import logger from "./config/logger";
import { closeDbConnection } from "./db";

const PORT = process.env.PORT || 5005;

const requiredEnvVars = [
  "TOKEN_SECRET",
  "MONGODB_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    logger.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
});

const rateLimitEnvVars = [
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX",
  "AUTH_RATE_LIMIT_WINDOW_MS",
  "AUTH_RATE_LIMIT_MAX",
];

rateLimitEnvVars.forEach((key) => {
  const rawValue = process.env[key];

  if (rawValue === undefined) {
    return;
  }

  const parsedValue = Number(rawValue);
  const isValidNumber = Number.isFinite(parsedValue);
  const isPositive = parsedValue > 0;

  if (!isValidNumber || !isPositive) {
    logger.error(
      `Invalid env var ${key}: expected a positive number, received "${rawValue}"`,
    );
    process.exit(1);
  }
});

const server = app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});

const gracefulShutdown = (signal: "SIGINT" | "SIGTERM") => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const forceCloseTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing process exit.");
    process.exit(1);
  }, 10000);

  server.close(async (err) => {
    clearTimeout(forceCloseTimer);

    if (err) {
      logger.error("Error while closing HTTP server", { error: err });
      process.exit(1);
      return;
    }

    try {
      await closeDbConnection();
      logger.info("Graceful shutdown completed.");
      process.exit(0);
    } catch (closeError) {
      logger.error("Error while closing MongoDB connection", {
        error: closeError,
      });
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
