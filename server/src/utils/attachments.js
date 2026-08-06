import { uploadToCloudinary } from './cloudinary.js';
import path from 'path';

export async function resolveAttachmentUrl(file) {
  if (!file) {
    throw Object.assign(new Error('File is required'), { statusCode: 400 });
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
    const uploaded = await uploadToCloudinary(file);
    return uploaded.secureUrl;
  }

  if (file.filename) {
    return `/uploads/${file.filename}`;
  }

  const fallbackName = `${Date.now()}${path.extname(file.originalname || '')}`;
  return `/uploads/${fallbackName}`;
}

