import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { prisma } from "../config/database";

const createBucket = async (req: Request, res: Response) => {
  const { bucket } = req.body;

  const directoryPath = path.join(__dirname, "../public/upload/img/", bucket);
  if (fs.existsSync(directoryPath)) {
    return res.status(400).send("Bucket already exists");
  }
  fs.mkdirSync(directoryPath);
  await prisma.bucket.create({
    data: {
      name: bucket,
    },
  });
  res.status(201).send("Bucket created");
};

const getBuckets = async (req: Request, res: Response) => {
  const buckets = await prisma.bucket.findMany();
  res.json({ buckets });
};

const deleteBucket = async (req: Request, res: Response) => {
  const { bucket } = req.params;
  const directoryPath = path.join(__dirname, "../public/upload/img/", bucket);
  if (!fs.existsSync(directoryPath)) {
    return res.status(404).send("Bucket not found");
  }
  fs.rmdirSync(directoryPath, { recursive: true });
  res.status(200).send("Bucket deleted");
};

export { createBucket, getBuckets, deleteBucket };
