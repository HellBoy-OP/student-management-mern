import { Schema, model, type HydratedDocument } from "mongoose";

export const genders = ["male", "female", "other"] as const;

export type Gender = (typeof genders)[number];

export interface Student {
  fullName: string;
  email: string;
  emailHash: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentDocument = HydratedDocument<Student>;

const studentSchema = new Schema<Student>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    emailHash: {
      type: String,
      required: true,
      select: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    courseEnrolled: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document: unknown, returnedObject: Record<string, unknown>) => {
        delete returnedObject.passwordHash;
        delete returnedObject.emailHash;
        return returnedObject;
      },
    },
    toObject: {
      transform: (_document: unknown, returnedObject: Record<string, unknown>) => {
        delete returnedObject.passwordHash;
        delete returnedObject.emailHash;
        return returnedObject;
      },
    },
  },
);

studentSchema.index({ emailHash: 1 }, { unique: true, sparse: true });

export const StudentModel = model<Student>("Student", studentSchema);
