import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import multer from "multer";
import { prisma } from "../config/database";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: DestinationCallback
  ): void => {
    if (!fs.existsSync(`./src/public/upload/img/${req.body.bucket}`)) {
      return cb(new Error("Bucket not found"), "");
    }
    cb(null, `./src/public/upload/img/${req.body.bucket}`);
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
    if (req.file.size > 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).send("File size exceeds 1MB");
    }
    if (req.file.mimetype !== "image/webp") {
      fs.unlinkSync(req.file.path);
      return res.status(400).send("File is not a webp image");
    }
    const size = fs.statSync(req.file.path).size
    const image = await prisma.item.create({
      data: {
        name: req.file.filename,
        path: req.file.path,
        url: `${process.env.API_URL}images/${req.body.bucket}/${req.file.filename}`,
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
      },
    },
  });
  res.json(buckets);
};

const getImage = async (req: Request, res: Response) => {
  const { bucket, filename } = req.params;
  const filePath = path.join(
    __dirname,
    "../public/upload/img/",
    bucket,
    filename
  );
  if (fs.existsSync(filePath)) {
    res.status(200).sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
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
  const filePath = path.join(
    __dirname,
    "../public/upload/img/",
    bucket.name,
    file.name
  );
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  fs.unlinkSync(filePath);
  await prisma.item.delete({
    where: {
      id: fileId,
    },
  });
  res.status(200).send("File deleted");
};

export { uploadImage, getImage, getImagesByBucket, deleteImage, getAllImages };
