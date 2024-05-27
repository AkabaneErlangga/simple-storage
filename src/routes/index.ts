import { Router } from "express";
import authRoutes from "./auth.route";
import bucketRoutes from "./bucket.route";
import imageRoutes from "./image.route";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();
router.use("/auth", authRoutes);
router.use("/buckets", authMiddleware, bucketRoutes);
router.use("/images", imageRoutes);

export default router;
