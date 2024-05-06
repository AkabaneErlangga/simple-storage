import { Router } from "express";
import { createBucket, deleteBucket, getBuckets, updateBucket } from "../controller/bucket.controller";

const router = Router();

router.get("/", getBuckets);
router.post("/", createBucket);
router.delete("/:bucketId", deleteBucket);
router.put("/:bucketId", updateBucket);

export default router;