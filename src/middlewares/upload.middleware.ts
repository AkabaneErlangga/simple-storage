import { Request, Response, NextFunction } from 'express';

const imageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if there are any files in the request
  const file = req.file;
  console.log(file);
  // if (!req.body.bucket) {
  //   return res.status(400).json({ message: 'Bucket name is required.' });
  // }
  if (!req.file) {
    return res.status(400).json({ message: 'No file were uploaded.' });
  }
  
  // if (file.mimetype !== 'image/webp') {
  //   return res.status(400).json({ message: 'Only webp files are allowed.' });
  // }
  
  next();
};

export default imageMiddleware;