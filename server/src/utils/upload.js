import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const localUploadDir = path.join(process.cwd(), 'server/uploads');

if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true });
    }
  } catch {
    // Local development only. If this fails, multer will still accept uploads in memory elsewhere.
  }
}

const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, localUploadDir),
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
      }
    });

export const upload = multer({ storage });

