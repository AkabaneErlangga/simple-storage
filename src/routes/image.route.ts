import { Router } from "express";
import {
	deleteImage,
	getAllImages,
	getImage,
	getImagesByBucket,
	uploadImage,
} from "../controller/image.controller";

const router = Router();

router.get("/", getAllImages);
router.get("/:bucketName", getImagesByBucket);
router.get("/:bucket/:filename", getImage);
router.post("/uploads", uploadImage);
router.delete("/:bucketId/:fileId", deleteImage);

export default router;
