import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import multer from "multer";
import { prisma } from "../config/database";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const bucketDir = "./src/public/upload/img/";

const storage = multer.diskStorage({
	destination: (
		req: Request,
		file: Express.Multer.File,
		cb: DestinationCallback
	): void => {
		if (!fs.existsSync(bucketDir + req.body.bucket)) {
			return cb(new Error("Bucket not found"), "");
		}
		cb(null, bucketDir + req.body.bucket);
	},
	filename: (
		req: Request,
		file: Express.Multer.File,
		cb: FileNameCallback
	): void => {
		cb(null, Date.now() + "-" + file.originalname);
	},
});
const upload = multer({ storage: storage });

const uploadImage = async (req: Request, res: Response) => {
	const acceptedImageTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
		"image/svg",
	];
	upload.single("file")(req, res, async (err) => {
		if (err) {
			return res.status(400).send(err.message);
		}
		if (!req.file) {
			return res.status(400).send("No files were uploaded.");
		}
		if (!req.body.bucket) {
			return res.status(400).send("Bucket not provided");
		}
		if (req.file.size > 10 * 1024 * 1024) {
			fs.unlinkSync(req.file.path);
			return res.status(400).send("File size exceeds 10MB");
		}

		if (!acceptedImageTypes.includes(req.file.mimetype)) {
			fs.unlinkSync(req.file.path);
			return res.status(400).send("File is not an image");
		}
		const size = fs.statSync(req.file.path).size;
		const image = await prisma.item.create({
			data: {
				name: req.file.filename,
				path: req.file.path,
				url: `${process.env.API_URL}/images/${req.body.bucket}/${req.file.filename}`,
				size,
				bucket: {
					connect: {
						name: req.body.bucket,
					},
				},
			},
			select: {
				id: true,
				name: true,
				url: true,
			},
		});

		res.status(201).json(image);
	});
};

const getAllImages = async (req: Request, res: Response) => {
	const buckets = await prisma.bucket.findMany({
		include: {
			items: {
				select: {
					id: true,
					name: true,
					url: true,
					size: true,
				},
				where: {
					deletedAt: null,
				},
			},
		},
	});
	res.json(buckets);
};

const getImage = async (req: Request, res: Response) => {
	const { bucket, filename } = req.params;
	const file = await prisma.item.findFirst({
		where: {
			name: filename,
			bucket: {
				name: bucket,
			},
			deletedAt: null,
		},
	});
	if (!file) {
		return res.status(404).send("File not found");
	}
	const filePath = path.join(bucketDir, bucket, filename);
	if (!fs.existsSync(filePath)) {
		return res.status(404).send("File not found");
	}
	res.sendFile(filePath, { root: "./" });
};

const getImagesByBucket = async (req: Request, res: Response) => {
	const { bucketName } = req.params;
	const bucket = await prisma.bucket.findUnique({
		where: {
			name: bucketName,
		},
		include: {
			items: {
				select: {
					id: true,
					name: true,
					url: true,
					size: true,
				},
				where: {
					deletedAt: null,
				},
			},
		},
	});
	if (!bucket) {
		return res.status(404).send("Bucket not found");
	}
	res.json(bucket);
};

const deleteImage = async (req: Request, res: Response) => {
	const { bucketId, fileId } = req.params;
	if (!fileId) {
		return res.status(400).send("File ID is required");
	}
	if (!bucketId) {
		return res.status(400).send("Bucket ID is required");
	}
	const bucket = await prisma.bucket.findUnique({
		where: {
			id: bucketId,
		},
	});
	const file = await prisma.item.findUnique({
		where: {
			id: fileId,
		},
	});
	if (!bucket) {
		return res.status(404).send("Bucket not found");
	}
	if (!file) {
		return res.status(404).send("File not found");
	}
	const filePath = path.join(bucketDir, bucket.name, file.name);
	if (!fs.existsSync(filePath)) {
		return res.status(404).send("File not found");
	}
	// fs.unlinkSync(filePath);
	try {
		await prisma.item.update({
			where: {
				id: fileId,
			},
			data: {
				deletedAt: new Date(),
			},
		});
	} catch (error) {
		return res.status(500).send("Error deleting file");
	}
	res.status(200).send("File deleted");
};

const destroyImage = async (req: Request, res: Response) => {
	const { fileId } = req.params;
	if (!fileId) {
		return res.status(400).send("File ID is required");
	}
	const file = await prisma.item.findUnique({
		where: {
			id: fileId,
			deletedAt: {
				not: null,
			},
		},
		include: {
			bucket: true,
		},
	});
	if (!file) {
		return res.status(404).send("File not found");
	}
	const filePath = path.join(bucketDir, file.bucket.name, file.name);
	if (!fs.existsSync(filePath)) {
		return res.status(404).send("File not found");
	}
	try {
		await prisma.item.delete({
			where: {
				id: fileId,
			},
		});
	} catch (error) {
		return res.status(500).send("Error deleting file");
	}
	fs.unlinkSync(filePath);
	res.status(200).send("File deleted");
};

const restoreImage = async (req: Request, res: Response) => {
	const { fileId } = req.params;
	if (!fileId) {
		return res.status(400).send("File ID is required");
	}
	const file = await prisma.item.findUnique({
		where: {
			id: fileId,
			deletedAt: {
				not: null,
			},
		},
		include: {
			bucket: true,
		},
	});
	if (!file) {
		return res.status(404).send("File not found");
	}
	const filePath = path.join(bucketDir, file.bucket.name, file.name);
	if (!fs.existsSync(filePath)) {
		return res.status(404).send("File not found");
	}
	await prisma.item.update({
		where: {
			id: fileId,
		},
		data: {
			deletedAt: null,
		},
	});
	res.status(200).send("File restored");
};

export {
	uploadImage,
	getImage,
	getImagesByBucket,
	deleteImage,
	getAllImages,
	destroyImage,
	restoreImage,
};
