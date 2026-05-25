import express from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import {
  validateRegister,
  validateLogin,
} from "../middleware/validation.middleware";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

router.get("/me", protect, getMe);

export default router;
