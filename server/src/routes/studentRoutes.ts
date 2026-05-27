import { Router } from "express";
import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
  validateStudent
} from "../controllers/studentController.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import type { StudentIdParams } from "../utils/studentInput.ts";

const router = Router();

router.get("/students", asyncHandler(getStudents));
router.post("/login", asyncHandler(validateStudent));
router.post("/register", asyncHandler(createStudent));
router.put<StudentIdParams>("/student/:id", asyncHandler(updateStudent));
router.delete<StudentIdParams>("/student/:id", asyncHandler(deleteStudent));

export default router;
