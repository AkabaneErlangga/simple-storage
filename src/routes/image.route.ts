import { Router } from "express";
import { deleteImage, getImage, getImagesByBucket, uploadImage } from "../controller/image.controller";

const router = Router();

router.post("/uploads", uploadImage);
router.get("/:bucket", getImagesByBucket);
router.get("/:bucket/:filename", getImage);
router.delete("/:filename", deleteImage);

export default router;