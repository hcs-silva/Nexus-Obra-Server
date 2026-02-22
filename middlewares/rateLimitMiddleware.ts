import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX ?? 100);
const authWindowMs = 15 * 60 * 1000;
const authMax = 5;

const apiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many authentication attempts, please try again in 15 minutes.",
  },
});

export default apiRateLimiter;
