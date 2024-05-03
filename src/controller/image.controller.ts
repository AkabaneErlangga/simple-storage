import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import multer from "multer";

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
  upload.single("file")(req, res, (err) => {
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

    res.json({
      image_url: `${process.env.API_URL}images/${req.body.bucket}/${req.file.filename}`,
    });
  });
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
  const { bucket } = req.params;
  
  const directoryPath = path.join(__dirname, "../public/upload/img/", bucket);
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send("Error reading directory");
    }
    const images = files.filter((file) => {
      const filePath = path.join(directoryPath, file);
      return fs.statSync(filePath).isFile();
    });
    res.json({ images });
  });
};

const deleteImage = async (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "/public/upload/img/", filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(200).send("File deleted");
  } else {
    res.status(404).send("File not found");
  }
};

export { uploadImage, getImage, getImagesByBucket, deleteImage };
