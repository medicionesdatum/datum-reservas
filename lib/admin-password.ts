import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const MIN_ADMIN_PASSWORD_LENGTH = 12;
export const MAX_ADMIN_PASSWORD_LENGTH = 128;

const KEY_LENGTH = 64;

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyAdminPasswordHash(password: string, stored: string) {
  const [scheme, saltValue, keyValue] = stored.split("$");
  if (scheme !== "scrypt" || !saltValue || !keyValue) return false;

  const expected = Buffer.from(keyValue, "base64");
  if (expected.length !== KEY_LENGTH) return false;

  const received = await deriveKey(password, Buffer.from(saltValue, "base64"));
  return timingSafeEqual(expected, received);
}

/** Devuelve un mensaje de error para mostrar al administrador, o null si la clave es válida. */
export function validateNewAdminPassword(newPassword: unknown, currentPassword: string) {
  if (typeof newPassword !== "string") return "Escribe la nueva clave.";
  if (newPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return `La nueva clave debe tener al menos ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (newPassword.length > MAX_ADMIN_PASSWORD_LENGTH) {
    return `La nueva clave no puede superar ${MAX_ADMIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (newPassword === "change-me" || newPassword === currentPassword) {
    return "La nueva clave debe ser distinta de la actual.";
  }
  return null;
}
