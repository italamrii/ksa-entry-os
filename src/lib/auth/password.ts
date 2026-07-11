import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
  algorithm: 2 as const, // Argon2id
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  password: string,
  hashValue: string
): Promise<boolean> {
  try {
    return await verify(hashValue, password, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
