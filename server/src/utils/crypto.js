import crypto from "crypto";

import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  return crypto.createHash("sha256").update(env.walletEncryptionSecret).digest();
}

export function encryptSecret(secret) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSecret(payload) {
  try {
    const [ivHex, authTagHex, encryptedHex] = payload.split(":");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new AppError("Failed to decrypt wallet secret", 500);
  }
}
