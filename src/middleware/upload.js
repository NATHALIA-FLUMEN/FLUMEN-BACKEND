import multer from 'multer';

const storage = multer.memoryStorage();

const VIDEO_MIME = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-m4v', 'video/mpeg', 'video/avi'
];

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function fileFilter(fieldName, allowed) {
  return (req, file, cb) => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  };
}

function limits(maxSizeMB) {
  return { fileSize: maxSizeMB * 1024 * 1024 };
}

export const uploadVideo = multer({
  storage,
  limits: limits(200),
  fileFilter: fileFilter('video', VIDEO_MIME)
});

export const uploadThumbnail = multer({
  storage,
  limits: limits(10),
  fileFilter: fileFilter('thumbnail', IMAGE_MIME)
});

export const uploadAny = multer({
  storage,
  limits: limits(200),
  fileFilter: (req, file, cb) => {
    if (VIDEO_MIME.includes(file.mimetype)) return cb(null, true);
    if (IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de archivo no permitido'));
  }
});
