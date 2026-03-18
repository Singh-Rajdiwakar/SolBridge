import { getCurrentUser, loginUser, registerUser } from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  return sendSuccess(res, result, 201);
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);
  return sendSuccess(res, result);
}

export async function logout(_req, res) {
  return sendSuccess(res, { message: "Logged out successfully" });
}

export async function me(req, res) {
  const user = await getCurrentUser(req.user);
  return sendSuccess(res, { user });
}
