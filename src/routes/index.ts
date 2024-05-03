import { Router } from "express";
import bucketRoutes from "./bucket.route";
import imageRoutes from "./image.route";

const router = Router();
router.use("/buckets", bucketRoutes);
router.use("/images", imageRoutes);

export default router;
