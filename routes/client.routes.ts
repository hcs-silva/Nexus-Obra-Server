import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import Client from "../models/Client.model";
import User from "../models/User.model";
import bcrypt from "bcrypt";
import isAuthenticated from "../middlewares/authMiddleware";
import logger from "../config/logger";
import { validateBody } from "../middlewares/validationMiddleware";
import {
  createClientSchema,
  manageClientMemberSchema,
  updateClientSchema,
} from "../validations/requestSchemas";

const router = Router();

const isMasterAdmin = (req: any): boolean =>
  req.payload?.role === "masterAdmin";
const isAdmin = (req: any): boolean => req.payload?.role === "Admin";
const getTokenClientId = (req: any): string =>
  String(req.payload?.clientId || "");

const handleClientRouteError = (
  res: Response,
  error: any,
  context: string,
): Response => {
  logger.error(`Client route error: ${context}`, { error });

  if (error?.code === 11000) {
    return res.status(409).json({
      message: "Duplicate resource",
      field: Object.keys(error.keyValue || {})[0],
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: "Validation error" });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource identifier." });
  }

  return res.status(500).json({ message: "Internal server error" });
};

router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    if (isMasterAdmin(req)) {
      const clients = await Client.find().sort({ clientName: 1 }).lean();
      return res.status(200).json(clients);
    }

    if (isAdmin(req)) {
      const tokenClientId = getTokenClientId(req);
      if (!tokenClientId) {
        return res.status(400).json({ message: "Client association missing." });
      }

      const client = await Client.findById(tokenClientId).lean();
      if (!client) {
        return res.status(404).json({ message: "Client not found." });
      }

      return res.status(200).json([client]);
    }

    return res.status(403).json({
      message: "Access denied. Only masterAdmin or Admin can access clients.",
    });
  } catch (error: any) {
    return handleClientRouteError(res, error, "list clients");
  }
});

//TODO: Add role-based access control to ensure only masterAdmin can access all clients and Admin can only access their own client.
//TODO: Implement more robust error handling and validation for client creation and updates.
//TODO: Consider adding endpoints for managing client members (adding/removing users from a client).

//TODO: Add endpoint for client admin to update their own client details (e.g., name, logo) without needing masterAdmin privileges.

//TODO: Implement endpoint for client admin to manage their own client members (e.g., add/remove users from their client) without needing masterAdmin privileges.

//TODO: Add endpoint for client admin to view their own client details and members without needing masterAdmin privileges.
//TODO: Create a separate router for client member management if the logic becomes complex (e.g., adding/removing users from a client, listing client members, etc.) to keep the code organized.

router.post(
  "/createClient",
  isAuthenticated,
  validateBody(createClientSchema),
  async (req: Request, res: Response) => {
    let adminUser: any;
    let newClient: any;
    try {
      if ((req as any).payload?.role !== "masterAdmin") {
        return res.status(403).json({
          message: "Access denied. Only masterAdmin can create clients.",
        });
      }

      const clientName = (req.body.clientName as string)?.trim();
      const adminUsername = (req.body.adminUsername as string)?.trim();
      const clientLogo = req.body.clientLogo as string;

      const hashedPassword = await bcrypt.hash(req.body.adminPassword, 12);

      adminUser = await User.create({
        username: adminUsername,
        password: hashedPassword,
        role: "Admin",
        resetPassword: true,
      });

      try {
        newClient = await Client.create({
          clientName: clientName,
          clientAdmin: adminUser._id,
          clientLogo: clientLogo,
          Members: [adminUser._id],
        });
      } catch (clientError: any) {
        await User.findByIdAndDelete(adminUser._id);
        throw clientError;
      }

      try {
        await User.updateOne(
          { _id: adminUser._id },
          { $set: { clientId: newClient._id } },
        );
      } catch (updateError: any) {
        await Client.findByIdAndDelete(newClient._id);
        await User.findByIdAndDelete(adminUser._id);
        return res
          .status(500)
          .json({ message: "Failed to link admin to client" });
      }

      res.status(201).json({
        message: "Client and admin created sucessfully",
        clientId: newClient._id,
        adminId: adminUser._id,
      });
    } catch (error: any) {
      if (adminUser && !newClient) {
        await User.findByIdAndDelete(adminUser._id);
      }
      return handleClientRouteError(res, error, "create client");
    }
  },
);

router.get("/me", isAuthenticated, async (req: any, res: Response) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Access denied. Admin role required.",
      });
    }

    const tokenClientId = getTokenClientId(req);
    if (!tokenClientId) {
      return res.status(400).json({ message: "Client association missing." });
    }

    const client = await Client.findById(tokenClientId)
      .populate("clientAdmin", "username role")
      .populate("Members", "username role clientId")
      .lean();

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    return res.status(200).json(client);
  } catch (error: any) {
    return handleClientRouteError(res, error, "get own client details");
  }
});

router.post(
  "/me/members",
  isAuthenticated,
  validateBody(manageClientMemberSchema),
  async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      const tokenClientId = getTokenClientId(req);
      if (!tokenClientId) {
        return res.status(400).json({ message: "Client association missing." });
      }

      const { userId } = req.body;
      const client = await Client.findById(tokenClientId);

      if (!client) {
        return res.status(404).json({ message: "Client not found." });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (user.role === "masterAdmin") {
        return res.status(400).json({
          message: "masterAdmin users cannot be assigned as client members.",
        });
      }

      if (user.clientId && String(user.clientId) !== tokenClientId) {
        return res.status(409).json({
          message: "User is already assigned to another client.",
        });
      }

      await User.findByIdAndUpdate(userId, {
        $set: { clientId: tokenClientId },
      });
      await Client.findByIdAndUpdate(tokenClientId, {
        $addToSet: { Members: user._id },
      });

      return res.status(200).json({ message: "Member added successfully." });
    } catch (error: any) {
      return handleClientRouteError(res, error, "add client member");
    }
  },
);

router.delete(
  "/me/members/:userId",
  isAuthenticated,
  async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      const tokenClientId = getTokenClientId(req);
      if (!tokenClientId) {
        return res.status(400).json({ message: "Client association missing." });
      }

      const { userId } = req.params;
      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user identifier." });
      }

      const client = await Client.findById(tokenClientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found." });
      }

      if (String(client.clientAdmin) === userId) {
        return res.status(400).json({
          message: "Cannot remove the client admin from members.",
        });
      }

      const user = await User.findById(userId);
      if (!user || String(user.clientId || "") !== tokenClientId) {
        return res.status(404).json({
          message: "Member not found in this client.",
        });
      }

      await User.findByIdAndUpdate(userId, { $unset: { clientId: "" } });
      await Client.findByIdAndUpdate(tokenClientId, {
        $pull: { Members: user._id },
      });

      return res.status(200).json({ message: "Member removed successfully." });
    } catch (error: any) {
      return handleClientRouteError(res, error, "remove client member");
    }
  },
);

router.get("/:clientId", isAuthenticated, async (req: any, res: Response) => {
  try {
    const clientId = req.params.clientId;
    if (!Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client identifier." });
    }

    // Non-masterAdmin users can only access their own client
    if (!isMasterAdmin(req)) {
      if (!isAdmin(req)) {
        return res.status(403).json({
          message: "Access denied. Admin or masterAdmin role required.",
        });
      }

      const tokenClientId = String(req.payload?.clientId || "");
      if (!tokenClientId || tokenClientId !== String(clientId)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions for this client.",
        });
      }
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }
    logger.debug("Client fetched", { clientId: client._id });
    res.status(200).json(client);
  } catch (error: any) {
    return handleClientRouteError(res, error, "get client by id");
  }
});

router.patch(
  "/me",
  isAuthenticated,
  validateBody(updateClientSchema),
  async (req: any, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      const tokenClientId = String(req.payload?.clientId || "");
      if (!tokenClientId) {
        return res.status(400).json({ message: "Client association missing." });
      }

      const allowedFields = [
        "clientName",
        "clientLogo",
        "clientEmail",
        "clientPhone",
      ];
      const updateData: Record<string, any> = {};

      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          updateData[key] = req.body[key];
        }
      }

      const updatedClient = await Client.findByIdAndUpdate(
        tokenClientId,
        updateData,
        { new: true },
      );

      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found." });
      }

      res.status(200).json(updatedClient);
    } catch (error: any) {
      return handleClientRouteError(res, error, "update own client");
    }
  },
);

router.patch(
  "/:clientId",
  isAuthenticated,
  validateBody(updateClientSchema),
  async (req: any, res: Response) => {
    try {
      const clientId = req.params.clientId;
      if (!Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ message: "Invalid client identifier." });
      }

      const updateData = req.body;

      // Non-masterAdmin users can only update their own client
      if (!isMasterAdmin(req)) {
        if (!isAdmin(req)) {
          return res.status(403).json({
            message: "Access denied. Admin or masterAdmin role required.",
          });
        }

        const tokenClientId = String(req.payload?.clientId || "");
        if (!tokenClientId || tokenClientId !== String(clientId)) {
          return res.status(403).json({
            message: "Access denied. Insufficient permissions for this client.",
          });
        }
      }

      const updatedClient = await Client.findByIdAndUpdate(
        clientId,
        updateData,
        {
          new: true,
        },
      );

      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found." });
      }

      res.status(200).json(updatedClient);
    } catch (error: any) {
      return handleClientRouteError(res, error, "update client by id");
    }
  },
);

router.delete(
  "/:clientId",
  isAuthenticated,
  async (req: any, res: Response) => {
    try {
      const clientId = req.params.clientId;
      if (!Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ message: "Invalid client identifier." });
      }

      if (!isMasterAdmin(req)) {
        return res.status(403).json({
          message: "Access denied. masterAdmin role required.",
        });
      }

      const existingClient = await Client.findById(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found." });
      }

      await User.updateMany(
        { clientId: existingClient._id },
        { $unset: { clientId: "" } },
      );

      await Client.findByIdAndDelete(existingClient._id);

      res.status(200).json({ message: "Client deleted successfully." });
    } catch (error: any) {
      return handleClientRouteError(res, error, "delete client");
    }
  },
);

export default router;
