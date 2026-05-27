import cors from "cors";
import type { ErrorRequestHandler } from "express";
import express from "express";
import studentRoutes from "./routes/studentRoutes.ts";

const app = express();

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Student Management API" });
});

app.use("/api", studentRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Internal server error.";

  const statusCode =
    typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
      ? 400
      : undefined;

  const isClientError =
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("Validation failed") ||
    message.includes("must be") ||
    message.includes("encrypted") ||
    message.includes("At least one field");

  res.status(statusCode ?? (isClientError ? 400 : 500)).json({
    message: statusCode === 400 ? "Student email already exists." : message,
  });
};

app.use(errorHandler);

export default app;
