import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const keyLength = 64;
const iterations = 100_000;
const digest = "sha512";
const encryptionPrefix = "enc:v1";
const algorithm = "aes-256-gcm";
const ivLength = 12;
const authTagLength = 16;

const serverEncryptionSecret = process.env.SERVER_ENCRYPTION_KEY as string;
const lookupSecret = process.env.LOOKUP_HASH_KEY ?? process.env.SERVER_ENCRYPTION_KEY as string;

const getEncryptionKey = () =>
  createHash("sha256").update(serverEncryptionSecret).digest();

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");

  return `${iterations}:${salt}:${hash}`;
};

export const verifyPassword = (password: string, passwordHash: string): boolean => {
  const [storedIterations, salt, storedHash] = passwordHash.split(":");

  if (!storedIterations || !salt || !storedHash) {
    return false;
  }

  const hash = pbkdf2Sync(
    password,
    salt,
    Number(storedIterations),
    keyLength,
    digest,
  ).toString("hex");

  if (hash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
};

export const encryptForStorage = (value: string): string => {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    encryptionPrefix,
    iv.toString("base64"),
    Buffer.concat([encrypted, authTag]).toString("base64"),
  ].join(":");
};

export const decryptFromStorage = (encryptedValue: string): string => {
  const [prefix, version, ivBase64, payloadBase64] = encryptedValue.split(":");

  if (`${prefix}:${version}` !== encryptionPrefix || !ivBase64 || !payloadBase64) {
    throw new Error("Encrypted data is invalid.");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const payload = Buffer.from(payloadBase64, "base64");
  const encrypted = payload.subarray(0, -authTagLength);
  const authTag = payload.subarray(-authTagLength);
  const decipher = createDecipheriv(algorithm, getEncryptionKey(), iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
};

export const hashLookupValue = (value: string): string =>
  createHmac("sha256", lookupSecret).update(value.toLowerCase().trim()).digest("hex");
