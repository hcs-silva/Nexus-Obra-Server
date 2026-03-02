import { Router, Request, Response, NextFunction } from "express";
import { getDbReadyState, isDbConnected } from "../db";
const router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json("All good in here");
});

router.get("/health", (req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  const dbState = getDbReadyState();

  if (!dbConnected) {
    return res.status(503).json({
      status: "degraded",
      uptime: process.uptime(),
      dbConnected,
      dbState,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    dbConnected,
    dbState,
    timestamp: new Date().toISOString(),
  });
});

export default router;
