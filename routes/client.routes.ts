import { Router, Request, Response } from "express";
import Client from "../models/Client.model";
import User from "../models/User.model";
import bcrypt from "bcrypt";
import isAuthenticated from "../middlewares/authMiddleware";
import logger from "../config/logger";
import { validateBody } from "../middlewares/validationMiddleware";
import {
  createClientSchema,
  updateClientSchema,
} from "../validations/requestSchemas";

const router = Router();

router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const clients = await Client.find().sort({ clientName: 1 }).lean();
    res.status(200).json(clients);
  } catch (error: any) {
    return res.status(500).json({ message: "Internal server error" });
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
      const clientName = (req.body.clientName as string)?.trim();
      const adminUsername = (req.body.adminUsername as string)?.trim();
      const adminPassword = req.body.adminPassword as string;
      const clientLogo = req.body.clientLogo as string;

      if (!clientName || !adminUsername || !adminPassword) {
        return res.status(400).json({ message: "All Fields are Required." });
      }
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
      if (error?.code === 11000) {
        //console.log("Duplicate key error:", error.keyValue);
        return res.status(409).json({
          message: "Duplicate resource",
          field: Object.keys(error.keyValue)[0],
        });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.get("/:clientId", isAuthenticated, async (req: any, res: Response) => {
  try {
    const clientId = req.params.clientId;

    // Non-masterAdmin users can only access their own client
    if (req.payload?.role !== "masterAdmin") {
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
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch(
  "/me",
  isAuthenticated,
  validateBody(updateClientSchema),
  async (req: any, res: Response) => {
    try {
      if (req.payload?.role !== "Admin") {
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

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update." });
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
      return res.status(500).json({ message: "Internal server error" });
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
      const updateData = req.body;

      // Non-masterAdmin users can only update their own client
      if (req.payload?.role !== "masterAdmin") {
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
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.delete(
  "/:clientId",
  isAuthenticated,
  async (req: any, res: Response) => {
    try {
      const clientId = req.params.clientId;

      if (req.payload?.role !== "masterAdmin") {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions for this client.",
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
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
