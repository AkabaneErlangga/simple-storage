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

const router = Router();

router.get("/", getAllImages);
router.get("/deleted", getDeletedImages);
router.get("/:bucketName", getImagesByBucket);
router.post("/uploads", uploadImage);
router.get("/:bucket", getImagesByBucket);
router.get("/:bucket/:filename", getImage);
router.post("/uploads", uploadImage);
router.put("/restore/:fileId", restoreImage);
router.delete("/destroy/:fileId", destroyImage);
router.delete("/:bucketId/:fileId", deleteImage);

export default router;
