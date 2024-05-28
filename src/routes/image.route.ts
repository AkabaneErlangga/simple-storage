import { Router } from "express";
import {
	deleteImage,
	destroyImage,
	getAllImages,
	getDeletedImages,
	getImage,
	getImagesByBucket,
	restoreImage,
	uploadImage,
} from "../controller/image.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getAllImages);
router.get("/deleted", authMiddleware, getDeletedImages);
router.get("/:bucketName", authMiddleware, getImagesByBucket);
router.post("/uploads", uploadImage);
router.get("/:bucket", authMiddleware, getImagesByBucket);
router.get("/:bucket/:filename", getImage);
router.put("/restore/:fileId", authMiddleware, restoreImage);
router.delete("/destroy/:fileId", authMiddleware, destroyImage);
router.delete("/:bucketId/:fileId", authMiddleware, deleteImage);

export default router;
