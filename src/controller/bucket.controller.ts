import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { prisma } from "../config/database";

const bucketDir = "./src/public/upload/img/";

const createBucket = async (req: Request, res: Response) => {
	const { bucketName } = req.body;
	if (!bucketName) {
		return res.status(400).send("Bucket name is required");
	}
	if (fs.existsSync(bucketDir + bucketName)) {
		return res.status(400).send("Bucket already exists");
	}
	fs.mkdirSync(bucketDir + bucketName, { recursive: true });
	try {
		const bucket = await prisma.bucket.create({
			data: {
				name: bucketName,
			},
		});
		res.status(201).json({ bucket });
	} catch (error: any) {
		console.log(error);
		if (error.code === "P2002") {
			res.status(400).send("Bucket already exists");
		}
	}
};

const getBuckets = async (req: Request, res: Response) => {
	const buckets = await prisma.bucket.findMany({
		include: {
			_count: {
				select: {
					items: {
						where: {
							deletedAt: null,
						},
					},
				},
			},
		},
	});

	const bucketsWithSize = await Promise.all(
		buckets.map(async (bucket) => {
			const files = await prisma.item.findMany({
				where: {
					bucketId: bucket.id,
					deletedAt: null,
				},
			});
			let totalSize = 0;
			for (const file of files) {
				totalSize += file.size;
			}
			return {
				...bucket,
				size: totalSize,
			};
		})
	);

	res.json(bucketsWithSize);
};

const updateBucket = async (req: Request, res: Response) => {
	const { bucketId } = req.params;
	const { bucketName } = req.body;
	if (!bucketId) {
		return res.status(400).send("Bucket ID is required");
	}
	if (!bucketName) {
		return res.status(400).send("Bucket name is required");
	}
	const bucket = await prisma.bucket.findUnique({
		where: {
			id: bucketId,
		},
	});
	if (!bucket) {
		return res.status(404).send("Bucket not found");
	}
	const directoryPath = path.join(bucketDir, bucket.name);
	const newDirectoryPath = path.join(bucketDir, bucketName);
	fs.renameSync(directoryPath, newDirectoryPath);
	const updatedBucket = await prisma.bucket.update({
		where: {
			id: bucketId,
		},
		data: {
			name: bucketName,
		},
	});
	res.json(updatedBucket);
};

const deleteBucket = async (req: Request, res: Response) => {
	const { bucketId } = req.params;
	if (!bucketId) {
		return res.status(400).send("Bucket ID is required");
	}
	const bucket = await prisma.bucket.findUnique({
		where: {
			id: bucketId,
		},
	});
	if (!bucket) {
		return res.status(404).send("Bucket not found");
	}
	const directoryPath = path.join(bucketDir, bucket.name);
	if (!fs.existsSync(directoryPath)) {
		return res.status(404).send("Bucket not found");
	}
	await prisma.bucket.delete({
		where: {
			id: bucketId,
		},
	});
	fs.rmSync(directoryPath, { recursive: true });
	res.status(200).send("Bucket deleted");
};

export { createBucket, getBuckets, deleteBucket, updateBucket };
