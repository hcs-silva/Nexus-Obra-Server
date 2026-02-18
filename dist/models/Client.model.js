"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const clientSchema = new mongoose_1.Schema({
    clientName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    clientEmail: { type: String, trim: true, lowercase: true },
    clientPhone: { type: String, trim: true },
    clientLogo: { type: String },
    clientAdmin: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    subStatus: { type: Boolean, default: false },
    Members: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
});
// Create unique indexes with partial filter expressions to allow multiple null values
clientSchema.index({ clientEmail: 1 }, {
    unique: true,
    partialFilterExpression: { clientEmail: { $type: "string" } },
});
clientSchema.index({ clientPhone: 1 }, {
    unique: true,
    partialFilterExpression: { clientPhone: { $type: "string" } },
});
const Client = (0, mongoose_1.model)("Client", clientSchema);
exports.default = Client;
