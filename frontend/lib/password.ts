import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  }).toString("hex");

  return ["scrypt", SCRYPT_PARAMS.N, SCRYPT_PARAMS.r, SCRYPT_PARAMS.p, salt, derived].join("$");
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [algo, nRaw, rRaw, pRaw, salt, stored] = encodedHash.split("$");
  if (!algo || !nRaw || !rRaw || !pRaw || !salt || !stored) return false;
  if (algo !== "scrypt") return false;

  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const derived = scryptSync(password, salt, stored.length / 2, {
    N: n,
    r,
    p,
  });

  const storedBuffer = Buffer.from(stored, "hex");
  if (storedBuffer.length !== derived.length) return false;

  return timingSafeEqual(storedBuffer, derived);
}
