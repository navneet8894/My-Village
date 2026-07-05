const { uploadBuffer } = require('../services/cloudinaryService');

function guessResourceType(mimetype) {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  return 'auto';
}

async function uploadMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'file required' });
    }
    const folder = req.body.folder || 'uploads';
    const rt = guessResourceType(req.file.mimetype);
    const result = await uploadBuffer(req.file.buffer, folder, rt);
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    });
  } catch (e) {
    if (e.message?.includes('not configured')) {
      return res.status(503).json({
        message:
          'File storage not configured. Set CLOUDINARY_* environment variables.',
      });
    }
    next(e);
  }
}

module.exports = { uploadMedia };
