import CryptoJS from "crypto-js";
import { Keypair } from "@solana/web3.js";

const RETIX_ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_RETIX_ENCRYPTION_KEY || "solanablocks-retix-wallet";

function serializeSecretKey(secretKey: Uint8Array) {
  return JSON.stringify(Array.from(secretKey));
}

function parseSecretKey(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return Uint8Array.from(parsed);
    }
  } catch {
    const fallback = value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => Number(entry));

    if (fallback.length > 0) {
      return Uint8Array.from(fallback);
    }
  }

  throw new Error("Invalid private key format. Use a JSON array or comma-separated secret key.");
}

export function encryptRetixSecretKey(secretKey: Uint8Array) {
  return CryptoJS.AES.encrypt(serializeSecretKey(secretKey), RETIX_ENCRYPTION_KEY).toString();
}

export function decryptRetixSecretKey(cipherText: string) {
  const bytes = CryptoJS.AES.decrypt(cipherText, RETIX_ENCRYPTION_KEY);
  const decoded = bytes.toString(CryptoJS.enc.Utf8);

  if (!decoded) {
    throw new Error("Unable to decrypt Retix Wallet secret key.");
  }

  return parseSecretKey(decoded);
}

export function createRetixWalletPair() {
  const keypair = Keypair.generate();

  return {
    publicKey: keypair.publicKey.toBase58(),
    encryptedSecretKey: encryptRetixSecretKey(keypair.secretKey),
  };
}

export function importRetixWalletPair(privateKey: string) {
  const secretKey = parseSecretKey(privateKey);

  if (secretKey.length !== 64) {
    throw new Error("A Solana secret key must contain 64 bytes.");
  }

  const keypair = Keypair.fromSecretKey(secretKey);

  return {
    publicKey: keypair.publicKey.toBase58(),
    encryptedSecretKey: encryptRetixSecretKey(secretKey),
  };
}

export function getRetixKeypair(encryptedSecretKey: string) {
  return Keypair.fromSecretKey(decryptRetixSecretKey(encryptedSecretKey));
}

export function exportRetixPrivateKey(encryptedSecretKey: string) {
  return serializeSecretKey(decryptRetixSecretKey(encryptedSecretKey));
}
