import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    proposerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "active" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    quorum: { type: Number, required: true },
    votesYes: { type: Number, default: 0 },
    votesNo: { type: Number, default: 0 },
    votesAbstain: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Proposal = mongoose.models.Proposal || mongoose.model("Proposal", proposalSchema);
