const streamifier = require('streamifier');
const { cloudinary, initCloudinary } = require('../config/cloudinary');

initCloudinary();

function uploadBuffer(buffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return reject(new Error('Cloudinary is not configured'));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: `village_management/${folder}`, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { uploadBuffer };
