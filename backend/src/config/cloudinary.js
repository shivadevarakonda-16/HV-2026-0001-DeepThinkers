const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Cloudinary] Cloudinary SDK configured with cloud:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('[Cloudinary] Cloudinary credentials not detected in .env. Using local uploads/ fallback storage.');
}

/**
 * Upload a buffer or local file to Cloudinary (or local storage fallback)
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Target filename / public_id
 * @param {string} folder - Destination folder
 * @param {string} resourceType - 'auto' | 'image' | 'raw'
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadCertificateFile = async (buffer, filename, folder = 'credora_certificates', resourceType = 'auto') => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename.replace(/\.[^/.]+$/, ''),
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Upload error:', error);
            return reject(error);
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );
      uploadStream.end(buffer);
    });
  } else {
    
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const cleanFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, cleanFilename);
    fs.writeFileSync(filePath, buffer);

    const port = process.env.PORT || 5000;
    const publicUrl = `/uploads/${cleanFilename}`;

    return {
      secure_url: publicUrl,
      public_id: `local_${cleanFilename}`,
      localFilePath: filePath,
    };
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadCertificateFile,
};
