import express, { Request } from "express";
import multer from "multer";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const app = express();
const port = process.env.PORT || 3001;

dotenv.config();

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

app.use(bodyParser.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
const upload = multer({ storage: storage });

app.post("/uploads", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }
    if (!req.file) {
      return res.status(400).send("No files were uploaded.");
    }
    res.json({
      image_url: `${process.env.API_URL}img/${req.body.bucket}/${req.file.filename}`,
    });
  });
});

app.get("/img/:bucket/:filename", (req, res) => {
  const { bucket, filename } = req.params;
  const filePath = path.join(
    __dirname,
    "/public/upload/img/",
    bucket,
    filename
  );
  if (fs.existsSync(filePath)) {
    res.status(200).sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

app.post("/buckets", (req, res) => {
  const { bucket } = req.body;
  const directoryPath = path.join(__dirname, "/public/upload/img/", bucket);
  if (fs.existsSync(directoryPath)) {
    return res.status(400).send("Bucket already exists");
  }
  fs.mkdirSync(directoryPath);
  res.status(201).send("Bucket created");
});

app.delete("/img/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "/public/upload/img/", filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(200).send("File deleted");
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/images", (req, res) => {
  const directoryPath = path.join(__dirname, "/public/upload/img/");
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
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
