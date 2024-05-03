import { Router } from "express";
import { createBucket, deleteBucket, getBuckets } from "../controller/bucket.controller";

const router = Router();

router.get("/", getBuckets);
router.post("/", createBucket);
router.delete("/:bucket", deleteBucket);

export default router;