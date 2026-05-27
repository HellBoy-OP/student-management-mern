import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { webcrypto } from "node:crypto";
import { StudentModel, type StudentDocument } from "../models/Student.ts";
import {
  decryptFromStorage,
  encryptForStorage,
  hashLookupValue,
  hashPassword,
  verifyPassword,
} from "../utils/crypto.ts";
import {
  getCreateStudentInput,
  getUpdateStudentInput,
  getValidateStudentInput,
  type CreateStudentInput,
  type StudentIdParams,
  type StudentResponse,
} from "../utils/studentInput.ts";

type ApiMessage = { message: string };
type StudentEncryptedFields = Omit<CreateStudentInput, "password">;

const encryptedFieldNames = [
  "fullName",
  "email",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "address",
  "courseEnrolled",
] as const;

const clientEncryptedFieldNames = [...encryptedFieldNames, "password"] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isClientEncryptedValue = (value: string): boolean => {
  const [prefix, version, ivBase64, payloadBase64] = value.split(":");

  return `${prefix}:${version}` === "enc:v1" && Boolean(ivBase64 && payloadBase64);
};

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const buffer = Buffer.from(value, "base64");
  const bytes = new Uint8Array(buffer.length);

  bytes.set(buffer);

  return bytes;
};

const decryptClientValue = async (value: string): Promise<string> => {
  if (!isClientEncryptedValue(value)) {
    throw new Error("Request data must be encrypted.");
  }

  const [, , ivBase64, payloadBase64] = value.split(":");
  const iv = base64ToBytes(ivBase64 as string);
  const payload = base64ToBytes(payloadBase64 as string);

  const cryptoKey = await webcrypto.subtle.importKey(
    "raw",
    await webcrypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        process.env.CLIENT_ENCRYPTION_KEY ??
        "dev-client-encryption-key-change-me",
      ),
    ),
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const decrypted = await webcrypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    payload,
  );

  return new TextDecoder().decode(decrypted);
};

const decryptClientPayload = async (
  body: unknown,
  fields: readonly string[],
): Promise<unknown> => {
  if (!isObject(body)) {
    return body;
  }

  const decryptedBody: Record<string, unknown> = { ...body };

  await Promise.all(
    fields.map(async (fieldName) => {
      const value = decryptedBody[fieldName];

      if (typeof value === "string") {
        decryptedBody[fieldName] = await decryptClientValue(value);
      }
    }),
  );

  return decryptedBody;
};

const pickClientEncryptedFields = (body: unknown): StudentEncryptedFields => {
  if (!isObject(body)) {
    throw new Error("Request body must be an object.");
  }

  return encryptedFieldNames.reduce((fields, fieldName) => {
    const value = body[fieldName];

    if (typeof value !== "string" || !isClientEncryptedValue(value)) {
      throw new Error(`${fieldName} is required.`);
    }

    return {
      ...fields,
      [fieldName]: value,
    };
  }, {} as StudentEncryptedFields);
};

const encryptStudentForStorage = (student: StudentEncryptedFields) =>
  encryptedFieldNames.reduce((encryptedStudent, fieldName) => ({
    ...encryptedStudent,
    [fieldName]: encryptForStorage(student[fieldName]),
  }), {} as StudentEncryptedFields);

const decryptStudentForClient = (student: StudentDocument): StudentResponse => {
  const studentObject = student.toObject();

  return {
    ...studentObject,
    ...encryptedFieldNames.reduce((decryptedStudent, fieldName) => ({
      ...decryptedStudent,
      [fieldName]: decryptFromStorage(studentObject[fieldName]),
    }), {} as StudentEncryptedFields),
  };
};

export const createStudent: RequestHandler<
  never,
  ApiMessage,
  unknown
> = async (req, res) => {
  const decryptedBody = await decryptClientPayload(req.body, clientEncryptedFieldNames);
  const { password, ...studentInput } = getCreateStudentInput(decryptedBody);
  const clientEncryptedStudent = pickClientEncryptedFields(req.body);

  await StudentModel.create({
    ...encryptStudentForStorage(clientEncryptedStudent),
    emailHash: hashLookupValue(studentInput.email),
    passwordHash: hashPassword(password),
  });

  res.status(201).json({ message: "Success" });
};

export const getStudents: RequestHandler<never, StudentResponse[]> = async (
  _req,
  res,
) => {
  const students = await StudentModel.find().sort({ createdAt: -1 });

  res
    .status(200)
    .json(students.map((student: StudentDocument) => decryptStudentForClient(student)));
};

export const validateStudent: RequestHandler<
  never,
  StudentResponse | ApiMessage,
  unknown
> = async (req, res) => {
  const decryptedBody = await decryptClientPayload(req.body, ["email", "password"]);
  const { email, password } = getValidateStudentInput(decryptedBody);
  const student = await StudentModel
    .findOne({ emailHash: hashLookupValue(email) })
    .select("+passwordHash");

  if (!student || !verifyPassword(password, student.passwordHash)) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  res.status(200).json(decryptStudentForClient(student));
};

export const updateStudent: RequestHandler<
  StudentIdParams,
  StudentResponse | ApiMessage,
  unknown
> = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid student id." });
    return;
  }

  const decryptedBody = await decryptClientPayload(req.body, clientEncryptedFieldNames);
  const input = getUpdateStudentInput(decryptedBody);
  const clientEncryptedInput = isObject(req.body) ? req.body : {};
  const update: Record<string, unknown> = {
    ...Object.fromEntries(
      encryptedFieldNames
        .filter((fieldName) => typeof clientEncryptedInput[fieldName] === "string")
        .map((fieldName) => [
          fieldName,
          encryptForStorage(clientEncryptedInput[fieldName] as string),
        ]),
    ),
    ...(input.email ? { emailHash: hashLookupValue(input.email) } : {}),
    ...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
  };

  const student = await StudentModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!student) {
    res.status(404).json({ message: "Student not found." });
    return;
  }

  res.status(200).json(decryptStudentForClient(student));
};

export const deleteStudent: RequestHandler<StudentIdParams, ApiMessage> = async (
  req,
  res,
) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid student id." });
    return;
  }

  const student = await StudentModel.findByIdAndDelete(id);

  if (!student) {
    res.status(404).json({ message: "Student not found." });
    return;
  }

  res.status(200).json({ message: "Student deleted successfully." });
};
