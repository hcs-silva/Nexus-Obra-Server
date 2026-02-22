"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Client_model_1 = __importDefault(require("../models/Client.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.default, async (req, res) => {
    try {
        const clients = await Client_model_1.default.find().sort({ clientName: 1 }).lean();
        res.status(200).json(clients);
    }
    catch (error) {
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
router.post("/createClient", authMiddleware_1.default, async (req, res) => {
    let adminUser;
    let newClient;
    try {
        const clientName = req.body.clientName?.trim();
        const adminUsername = req.body.adminUsername?.trim();
        const adminPassword = req.body.adminPassword;
        const clientLogo = req.body.clientLogo;
        if (!clientName || !adminUsername || !adminPassword) {
            return res.status(400).json({ message: "All Fields are Required." });
        }
        const hashedPassword = await bcrypt_1.default.hash(req.body.adminPassword, 12);
        adminUser = await User_model_1.default.create({
            username: adminUsername,
            password: hashedPassword,
            role: "Admin",
            resetPassword: true,
        });
        try {
            newClient = await Client_model_1.default.create({
                clientName: clientName,
                clientAdmin: adminUser._id,
                clientLogo: clientLogo,
            });
        }
        catch (clientError) {
            await User_model_1.default.findByIdAndDelete(adminUser._id);
            throw clientError;
        }
        try {
            await User_model_1.default.updateOne({ _id: adminUser._id }, { $set: { clientId: newClient._id } });
        }
        catch (updateError) {
            await Client_model_1.default.findByIdAndDelete(newClient._id);
            await User_model_1.default.findByIdAndDelete(adminUser._id);
            return res
                .status(500)
                .json({ message: "Failed to link admin to client" });
        }
        res.status(201).json({
            message: "Client and admin created sucessfully",
            clientId: newClient._id,
            adminId: adminUser._id,
        });
    }
    catch (error) {
        if (adminUser && !newClient) {
            await User_model_1.default.findByIdAndDelete(adminUser._id);
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
});
router.get("/:clientId", authMiddleware_1.default, async (req, res) => {
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
        const client = await Client_model_1.default.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: "Client not found." });
        }
        logger_1.default.debug("Client fetched", { clientId: client._id });
        res.status(200).json(client);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.patch("/me", authMiddleware_1.default, async (req, res) => {
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
        const updateData = {};
        for (const key of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updateData[key] = req.body[key];
            }
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields to update." });
        }
        const updatedClient = await Client_model_1.default.findByIdAndUpdate(tokenClientId, updateData, { new: true });
        if (!updatedClient) {
            return res.status(404).json({ message: "Client not found." });
        }
        res.status(200).json(updatedClient);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.patch("/:clientId", authMiddleware_1.default, async (req, res) => {
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
        const updatedClient = await Client_model_1.default.findByIdAndUpdate(clientId, updateData, {
            new: true,
        });
        if (!updatedClient) {
            return res.status(404).json({ message: "Client not found." });
        }
        res.status(200).json(updatedClient);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.delete("/:clientId", authMiddleware_1.default, async (req, res) => {
    try {
        const clientId = req.params.clientId;
        if (req.payload?.role !== "masterAdmin") {
            return res.status(403).json({
                message: "Access denied. Insufficient permissions for this client.",
            });
        }
        const existingClient = await Client_model_1.default.findById(clientId);
        if (!existingClient) {
            return res.status(404).json({ message: "Client not found." });
        }
        await User_model_1.default.updateMany({ clientId: existingClient._id }, { $unset: { clientId: "" } });
        await Client_model_1.default.findByIdAndDelete(existingClient._id);
        res.status(200).json({ message: "Client deleted successfully." });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
