const encryptionPrefix = "enc:v1";
const encryptionSecret = import.meta.env.VITE_CLIENT_ENCRYPTION_KEY;

const encryptedFieldNames = [
  "fullName",
  "email",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "address",
  "courseEnrolled",
] as const;

const requestEncryptedFieldNames = [...encryptedFieldNames, "password"] as const;

type EncryptedField = (typeof encryptedFieldNames)[number];
type RequestEncryptedField = (typeof requestEncryptedFieldNames)[number];

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const getEncryptionKey = async () =>
  crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", textEncoder.encode(encryptionSecret)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );

export const encryptValue = async (value: string): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    await getEncryptionKey(),
    textEncoder.encode(value),
  );

  return [
    encryptionPrefix,
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(encrypted)),
  ].join(":");
};

export const decryptValue = async (encryptedValue: string): Promise<string> => {
  const [prefix, version, ivBase64, payloadBase64] = encryptedValue.split(":");

  if (`${prefix}:${version}` !== encryptionPrefix || !ivBase64 || !payloadBase64) {
    return encryptedValue;
  }

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(ivBase64),
      tagLength: 128,
    },
    await getEncryptionKey(),
    base64ToBytes(payloadBase64),
  );

  return textDecoder.decode(decrypted);
};

export const encryptRequestPayload = async <
  TPayload extends Partial<Record<RequestEncryptedField, string>>,
>(
  payload: TPayload,
): Promise<TPayload> => {
  const encryptedPayload = { ...payload };

  await Promise.all(
    requestEncryptedFieldNames.map(async (fieldName) => {
      const value = encryptedPayload[fieldName];

      if (typeof value === "string") {
        encryptedPayload[fieldName] = await encryptValue(value);
      }
    }),
  );

  return encryptedPayload;
};

export const decryptStudentPayload = async <
  TPayload extends Partial<Record<EncryptedField, string>>,
>(
  payload: TPayload,
): Promise<TPayload> => {
  const decryptedPayload = { ...payload };

  await Promise.all(
    encryptedFieldNames.map(async (fieldName) => {
      const value = decryptedPayload[fieldName];

      if (typeof value === "string") {
        decryptedPayload[fieldName] = await decryptValue(value);
      }
    }),
  );

  return decryptedPayload;
};
