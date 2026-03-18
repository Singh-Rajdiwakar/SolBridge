import mongoose from "mongoose";

const jobRunLogSchema = new mongoose.Schema(
  {
    jobName: { type: String, required: true, index: true },
    status: { type: String, enum: ["success", "failed", "running"], default: "success", index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

jobRunLogSchema.index({ jobName: 1, createdAt: -1 });

export const JobRunLog = mongoose.models.JobRunLog || mongoose.model("JobRunLog", jobRunLogSchema);
