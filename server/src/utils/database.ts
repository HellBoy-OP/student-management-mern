import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is required.");
  }

  await mongoose.connect(mongoUri, { dbName: "merntask" });
  console.log("MongoDB connected");
};
