import { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import express from "express";
import logger from "./logger";

export default (app: Application): void => {
  app.use(cors());
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
};
