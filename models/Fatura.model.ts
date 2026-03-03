import { Schema } from "mongoose";

const faturaSchema = new Schema(
  {
    obraId: {
      type: Schema.Types.ObjectId,
      ref: "Obra",
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
  },
  {
    _id: true,
  },
);

export default faturaSchema;
