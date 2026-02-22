import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the required roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated (req.payload should be set by isAuthenticated middleware)
      if (!req.payload) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user role from token payload
      const userRole = req.payload.role;

      // Check if user role is in the allowed roles list
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
          requiredRoles: allowedRoles,
          userRole: userRole,
        });
      }

      // User has required role, proceed to next middleware
      next();
    } catch (error) {
      logger.error("Role authorization error", {
        allowedRoles,
        error,
      });
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};

export default requireRole;
