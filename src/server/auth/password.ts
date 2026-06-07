import { hash, verify } from "@node-rs/argon2";

// argon2id with sensible defaults.
const opts = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, opts);
}

export function verifyPassword(hashStr: string, password: string): Promise<boolean> {
  return verify(hashStr, password, opts);
}
