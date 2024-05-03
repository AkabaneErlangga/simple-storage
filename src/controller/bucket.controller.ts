import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { prisma } from "../config/database";

const createBucket = async (req: Request, res: Response) => {
  const { bucketName } = req.body;
  if (!bucketName) {
    return res.status(400).send("Bucket name is required");
  }

  const directoryPath = path.join(__dirname, "../public/upload/img/", bucketName);
  if (fs.existsSync(directoryPath)) {
    return res.status(400).send("Bucket already exists");
  }
  fs.mkdirSync(directoryPath);
  const bucket = await prisma.bucket.create({
    data: {
      name: bucketName,
    },
  });
  res.status(201).json({ bucket });
};

const getBuckets = async (req: Request, res: Response) => {
  const buckets = await prisma.bucket.findMany();
  res.json(buckets);
};

const deleteBucket = async (req: Request, res: Response) => {
  const { bucketId } = req.params;
  if (!bucketId) {
    return res.status(400).send("Bucket ID is required");
  }
  const bucket = await prisma.bucket.findUnique({
    where: {
      id: bucketId
    },
  });
  const directoryPath = path.join(__dirname, "../public/upload/img/", bucket?.name || '');
  if (!fs.existsSync(directoryPath)) {
    return res.status(404).send("Bucket not found");
  }
  fs.rmSync(directoryPath, { recursive: true });
  res.status(200).send("Bucket deleted");
};

export { createBucket, getBuckets, deleteBucket };
