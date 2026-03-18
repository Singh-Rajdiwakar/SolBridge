import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema(
  {
    traitType: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const nftSchema = new mongoose.Schema(
  {
    mint: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    collection: { type: String, required: true },
    owner: { type: String, required: true },
    description: { type: String, default: "" },
    attributes: { type: [attributeSchema], default: [] },
  },
  { timestamps: true, suppressReservedKeysWarning: true },
);

export const NFT = mongoose.models.NFT || mongoose.model("NFT", nftSchema);
