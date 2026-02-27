import { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import logger from "./logger";

export default (app: Application): void => {
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS || "http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestPartsToSanitize = ["body", "params", "query"] as const;

    requestPartsToSanitize.forEach((part) => {
      const target = req[part] as Record<string, unknown> | undefined;

      if (target && mongoSanitize.has(target)) {
        mongoSanitize.sanitize(target);
        logger.warn("NoSQL injection payload sanitized", {
          method: req.method,
          path: req.originalUrl,
          ip: req.ip,
          requestPart: part,
        });
      }
    });

    next();
  });
};
