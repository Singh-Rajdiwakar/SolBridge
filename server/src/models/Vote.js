import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    voteType: { type: String, enum: ["yes", "no", "abstain"], required: true },
    votingPower: { type: Number, required: true },
    reward: { type: Number, default: 0 },
  },
  { timestamps: true },
);

voteSchema.index({ proposalId: 1, userId: 1 }, { unique: true });

export const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);
