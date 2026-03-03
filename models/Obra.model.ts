import { Schema, model } from "mongoose";
import faturaSchema from "./Fatura.model";

const cadernoEncargosSchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    uploadDate: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const obraSchema = new Schema(
  {
    obraName: {
      type: String,
      required: true,
      trim: true,
    },
    obraDescription: {
      type: String,
      trim: true,
    },
    obraLocation: {
      type: String,
      trim: true,
    },
    obraStatus: {
      type: String,
      enum: ["planning", "in-progress", "completed", "on-hold"],
      default: "planning",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    budget: {
      type: Number,
    },
    cadernoEncargos: {
      type: cadernoEncargosSchema,
      required: false,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    faturas: {
      type: [faturaSchema],
      default: [],
    },
    totalExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
    responsibleUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Obra = model("Obra", obraSchema);

export default Obra;
