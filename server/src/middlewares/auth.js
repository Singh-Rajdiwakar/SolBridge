import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ensureUserWalletIdentity } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

export async function authenticate(req, _res, next) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.split(" ")[1] : null;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = await ensureUserWalletIdentity(user);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.split(" ")[1] : null;

    if (!token) {
      next();
      return;
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id);
    if (user) {
      req.user = await ensureUserWalletIdentity(user);
    }
    next();
  } catch (_error) {
    next();
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };
}

export const authMiddleware = authenticate;
export const adminMiddleware = authorize("admin");
