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

app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
