import { ZodError } from "zod";

import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

export function notFound(_req, _res, next) {
  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return sendError(res, "Validation failed", 400, error.flatten());
  }

  const statusCode = error.statusCode || 500;
  const details =
    env.nodeEnv === "development" ? error.details || error.stack : undefined;

  return sendError(res, error.message || "Internal server error", statusCode, details);
}

export const notFoundHandler = notFound;
