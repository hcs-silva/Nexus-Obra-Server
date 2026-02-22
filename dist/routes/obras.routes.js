"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Obra_model_1 = __importDefault(require("../models/Obra.model"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = (0, express_1.Router)();
// router.post("/seedExamplesPublic", async (req: Request, res: Response) => {
//   try {
//     if (process.env.NODE_ENV === "production") {
//       return res.status(403).json({ message: "Seed endpoint disabled." });
//     }
//     let clientId = req.body.clientId ?? req.query.clientId;
//     if (!clientId) {
//       const userWithClient = await User.findOne({ clientId: { $ne: null } })
//         .select("clientId")
//         .lean();
//       clientId = userWithClient?.clientId;
//     }
//     if (!clientId) {
//       return res.status(400).json({
//         message: "Client ID is required for seeding in this environment.",
//       });
//     }
//     const responsibleUsers = Array.isArray(req.body.responsibleUsers)
//       ? req.body.responsibleUsers
//       : [];
//     const examples = [
//       {
//         obraName: "Obra Central",
//         obraDescription: "Initial planning and permits",
//         obraLocation: "Porto",
//         obraStatus: "planning",
//         startDate: new Date("2025-11-01"),
//         budget: 250000,
//         clientId,
//         responsibleUsers,
//       },
//       {
//         obraName: "Renovacao Bairro",
//         obraDescription: "Structural and electrical updates",
//         obraLocation: "Lisboa",
//         obraStatus: "in-progress",
//         startDate: new Date("2025-09-15"),
//         endDate: new Date("2026-03-20"),
//         budget: 780000,
//         clientId,
//         responsibleUsers,
//       },
//       {
//         obraName: "Parque Comercial",
//         obraDescription: "Retail and parking construction",
//         obraLocation: "Braga",
//         obraStatus: "on-hold",
//         startDate: new Date("2025-06-10"),
//         budget: 1200000,
//         clientId,
//         responsibleUsers,
//       },
//       {
//         obraName: "Complexo Escolar",
//         obraDescription: "Final finishing and inspections",
//         obraLocation: "Coimbra",
//         obraStatus: "completed",
//         startDate: new Date("2024-02-01"),
//         endDate: new Date("2025-07-30"),
//         budget: 540000,
//         clientId,
//         responsibleUsers,
//       },
//     ];
//     const created = await Obra.insertMany(examples);
//     res.status(201).json({
//       message: "Example obras created successfully",
//       count: created.length,
//       obras: created,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });
router.get("/", authMiddleware_1.default, async (req, res) => {
    try {
        let query = {};
        // Non-masterAdmin users can only access obras from their client
        if (req.payload?.role !== "masterAdmin") {
            const tokenClientId = req.payload?.clientId;
            if (!tokenClientId) {
                return res.status(403).json({
                    message: "Access denied. No client associated with user.",
                });
            }
            query = { clientId: tokenClientId };
        }
        const obras = await Obra_model_1.default.find(query)
            .populate("clientId", "clientName")
            .populate("responsibleUsers", "username");
        res.status(200).json(obras);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/createObra", authMiddleware_1.default, async (req, res) => {
    try {
        const { obraName, obraDescription, obraLocation, obraStatus, startDate, endDate, budget, clientId, responsibleUsers, } = req.body;
        if (!obraName || !clientId) {
            return res
                .status(400)
                .json({ message: "Obra name and client ID are required." });
        }
        // Non-masterAdmin users can only create obras for their own client
        if (req.payload?.role !== "masterAdmin") {
            const tokenClientId = String(req.payload?.clientId || "");
            if (!tokenClientId || tokenClientId !== String(clientId)) {
                return res.status(403).json({
                    message: "Access denied. Cannot create obra for another client.",
                });
            }
        }
        const newObra = await Obra_model_1.default.create({
            obraName,
            obraDescription,
            obraLocation,
            obraStatus,
            startDate,
            endDate,
            budget,
            clientId,
            responsibleUsers,
        });
        res.status(201).json({
            message: "Obra created successfully",
            obra: newObra,
        });
    }
    catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message: "Duplicate resource",
                field: Object.keys(error.keyValue)[0],
            });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/:obraId", authMiddleware_1.default, async (req, res) => {
    try {
        const obraId = req.params.obraId;
        const obra = await Obra_model_1.default.findById(obraId);
        if (!obra) {
            return res.status(404).json({ message: "Obra not found." });
        }
        // Non-masterAdmin users can only access obras from their client
        if (req.payload?.role !== "masterAdmin") {
            const tokenClientId = String(req.payload?.clientId || "");
            const obraClientId = String(obra.clientId);
            if (!tokenClientId || tokenClientId !== obraClientId) {
                return res.status(403).json({
                    message: "Access denied. Insufficient permissions for this obra.",
                });
            }
        }
        // Populate after permission check
        await obra.populate("clientId", "clientName");
        await obra.populate("responsibleUsers", "username");
        res.status(200).json(obra);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.patch("/:obraId", authMiddleware_1.default, async (req, res) => {
    try {
        const obraId = req.params.obraId;
        const updateData = req.body;
        const obra = await Obra_model_1.default.findById(obraId);
        if (!obra) {
            return res.status(404).json({ message: "Obra not found." });
        }
        // Non-masterAdmin users can only update obras from their client
        if (req.payload?.role !== "masterAdmin") {
            const tokenClientId = String(req.payload?.clientId || "");
            const obraClientId = String(obra.clientId);
            if (!tokenClientId || tokenClientId !== obraClientId) {
                return res.status(403).json({
                    message: "Access denied. Insufficient permissions for this obra.",
                });
            }
            // Prevent non-masterAdmin from changing clientId
            if (updateData.clientId &&
                String(updateData.clientId) !== tokenClientId) {
                return res.status(403).json({
                    message: "Access denied. Cannot change client assignment.",
                });
            }
        }
        const updatedObra = await Obra_model_1.default.findByIdAndUpdate(obraId, updateData, {
            new: true,
        });
        // Populate after update
        await updatedObra?.populate("clientId", "clientName");
        await updatedObra?.populate("responsibleUsers", "username");
        res.status(200).json(updatedObra);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.delete("/:obraId", authMiddleware_1.default, async (req, res) => {
    try {
        const obraId = req.params.obraId;
        const obra = await Obra_model_1.default.findById(obraId);
        if (!obra) {
            return res.status(404).json({ message: "Obra not found." });
        }
        // Non-masterAdmin users can only delete obras from their client
        if (req.payload?.role !== "masterAdmin") {
            const tokenClientId = String(req.payload?.clientId || "");
            const obraClientId = String(obra.clientId);
            if (!tokenClientId || tokenClientId !== obraClientId) {
                return res.status(403).json({
                    message: "Access denied. Insufficient permissions for this obra.",
                });
            }
        }
        await Obra_model_1.default.findByIdAndDelete(obraId);
        res.status(200).json({ message: "Obra deleted successfully." });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
