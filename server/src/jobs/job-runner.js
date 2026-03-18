import { JobRunLog } from "../models/JobRunLog.js";
import { logger } from "../utils/logger.js";

export async function runTrackedJob(jobName, handler) {
  const log = await JobRunLog.create({
    jobName,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const details = await handler();
    log.status = "success";
    log.details = details || {};
    log.finishedAt = new Date();
    await log.save();

    logger.info("job.completed", {
      jobName,
      details,
    });

    return {
      jobName,
      status: "success",
      details,
    };
  } catch (error) {
    log.status = "failed";
    log.details = {
      error: error.message,
    };
    log.finishedAt = new Date();
    await log.save();

    logger.error("job.failed", {
      jobName,
      message: error.message,
    });

    throw error;
  }
}
