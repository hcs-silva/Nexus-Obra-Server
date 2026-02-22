import { Application, Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export default (app: Application): void => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // this middleware runs whenever requested page is not available
    res.status(404).json({ message: "This route does not exist" });
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    logger.error("Unhandled request error", {
      method: req.method,
      path: req.path,
      error: err,
    });

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal server error. Check the server console",
      });
    }
  });
};
