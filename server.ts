import app from "./app";
import logger from "./config/logger";

const PORT = process.env.PORT || 5005;

const requiredEnvVars = ["TOKEN_SECRET", "MONGODB_URI"];
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

app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
