import type { InferSchemaType } from "mongoose";
import { genders, StudentModel, type Gender } from "../models/Student.ts";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StudentResponse = InferSchemaType<typeof StudentModel.schema> & {
  _id: unknown;
};

export type StudentIdParams = {
  id: string;
};

export type CreateStudentInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  courseEnrolled: string;
  password: string;
};

export type UpdateStudentInput = Partial<CreateStudentInput>;

export type ValidateStudentInput = Pick<CreateStudentInput, "email" | "password">;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (
  body: Record<string, unknown>,
  key: keyof CreateStudentInput,
  required: boolean,
): string | undefined => {
  const value = body[key];

  if (value === undefined && !required) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
};

const readGender = (
  body: Record<string, unknown>,
  required: boolean,
): Gender | undefined => {
  const value = body.gender;

  if (value === undefined && !required) {
    return undefined;
  }

  if (typeof value !== "string" || !genders.includes(value as Gender)) {
    throw new Error("gender must be male, female, or other.");
  }

  return value as Gender;
};

const readDate = (
  body: Record<string, unknown>,
  required: boolean,
): string | undefined => {
  const value = readString(body, "dateOfBirth", required);

  if (value === undefined) {
    return undefined;
  }

  if (Number.isNaN(new Date(value).getTime())) {
    throw new Error("dateOfBirth must be a valid date.");
  }

  return value;
};

const readEmail = (
  body: Record<string, unknown>,
  required: boolean,
): string | undefined => {
  const value = readString(body, "email", required);

  if (value === undefined) {
    return undefined;
  }

  if (!emailPattern.test(value)) {
    throw new Error("email must be valid.");
  }

  return value.toLowerCase();
};

const readPassword = (
  body: Record<string, unknown>,
  required: boolean,
): string | undefined => {
  const value = readString(body, "password", required);

  if (value === undefined) {
    return undefined;
  }

  if (value.length < 8) {
    throw new Error("password must be at least 8 characters.");
  }

  return value;
};

export const getCreateStudentInput = (body: unknown): CreateStudentInput => {
  if (!isObject(body)) {
    throw new Error("Request body must be an object.");
  }

  return {
    fullName: readString(body, "fullName", true) as string,
    email: readEmail(body, true) as string,
    phoneNumber: readString(body, "phoneNumber", true) as string,
    dateOfBirth: readDate(body, true) as string,
    gender: readGender(body, true) as Gender,
    address: readString(body, "address", true) as string,
    courseEnrolled: readString(body, "courseEnrolled", true) as string,
    password: readPassword(body, true) as string,
  };
};

export const getUpdateStudentInput = (body: unknown): UpdateStudentInput => {
  if (!isObject(body)) {
    throw new Error("Request body must be an object.");
  }

  const input: UpdateStudentInput = {};
  const fullName = readString(body, "fullName", false);
  const email = readEmail(body, false);
  const phoneNumber = readString(body, "phoneNumber", false);
  const dateOfBirth = readDate(body, false);
  const gender = readGender(body, false);
  const address = readString(body, "address", false);
  const courseEnrolled = readString(body, "courseEnrolled", false);
  const password = readPassword(body, false);

  if (fullName !== undefined) input.fullName = fullName;
  if (email !== undefined) input.email = email;
  if (phoneNumber !== undefined) input.phoneNumber = phoneNumber;
  if (dateOfBirth !== undefined) input.dateOfBirth = dateOfBirth;
  if (gender !== undefined) input.gender = gender;
  if (address !== undefined) input.address = address;
  if (courseEnrolled !== undefined) input.courseEnrolled = courseEnrolled;
  if (password !== undefined) input.password = password;

  if (Object.keys(input).length === 0) {
    throw new Error("At least one field is required.");
  }

  return input;
};

export const getValidateStudentInput = (body: unknown): ValidateStudentInput => {
  if (!isObject(body)) {
    throw new Error("Request body must be an object.");
  }

  return {
    email: readEmail(body, true) as string,
    password: readPassword(body, true) as string,
  };
};
