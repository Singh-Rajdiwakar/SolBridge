import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    icon: { type: String, default: "" },
    change24h: { type: Number, default: 0 },
    mintAddress: { type: String, default: "", index: true },
  },
  { timestamps: true },
);

export const Token = mongoose.models.Token || mongoose.model("Token", tokenSchema);
