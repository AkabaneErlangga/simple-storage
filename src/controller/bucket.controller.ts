import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { prisma } from "../config/database";

const createBucket = async (req: Request, res: Response) => {
  const { bucketName } = req.body;
  if (!bucketName) {
    return res.status(400).send("Bucket name is required");
  }

  const directoryPath = path.join(
    __dirname,
    "../public/upload/img/",
    bucketName
  );
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
  const buckets = await prisma.bucket.findMany({
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  const bucketsWithSize = await Promise.all(
    buckets.map(async (bucket) => {
      const directoryPath = path.join(
        __dirname,
        "../public/upload/img/",
        bucket.name
      );
      const files = await fs.promises.readdir(directoryPath);
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
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
  const directoryPath = path.join(
    __dirname,
    "../public/upload/img/",
    bucket.name
  );
  const newDirectoryPath = path.join(
    __dirname,
    "../public/upload/img/",
    bucketName
  );
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
  const directoryPath = path.join(
    __dirname,
    "../public/upload/img/",
    bucket.name
  );
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
