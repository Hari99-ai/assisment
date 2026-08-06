function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw Object.assign(new Error(`Missing ${name}`), { statusCode: 500 });
  }
  return value;
}

export async function uploadToCloudinary(file) {
  const cloudName = getRequiredEnv('CLOUDINARY_CLOUD_NAME');
  const uploadPreset = getRequiredEnv('CLOUDINARY_UPLOAD_PRESET');

  if (!file?.buffer) {
    throw Object.assign(new Error('Upload buffer is missing'), { statusCode: 400 });
  }

  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }));
  form.append('upload_preset', uploadPreset);
  form.append('folder', 'team-task-manager');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: 'POST',
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`Cloudinary upload failed: ${text}`), { statusCode: 502 });
  }

  const payload = await response.json();
  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id
  };
}

