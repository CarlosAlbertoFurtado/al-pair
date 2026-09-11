// ══════════════════════════════════════════════════════════════
// Upload Route - Recebe imagens e retorna URL local
// Para produção: trocar por Cloudinary/S3
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticate } from '../../middleware/authenticate.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Define allowed mime types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

let storage;

if (process.env.CLOUDINARY_URL) {
  // Configura Cloudinary (a variável de ambiente CLOUDINARY_URL é pega automaticamente pelo SDK se configurada)
  // Mas para garantir, podemos deixar ele ler do env.
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'aupairconnect',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'],
    } as any,
  });
} else {
  // Fallback local
  const uploadDir = path.join(__dirname, '../../../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });
}

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WEBP, GIF ou PDF.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/upload - Upload de arquivo genérico
router.post('/', authenticate, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    return;
  }

  // Se usou cloudinary, a URL vem em req.file.path. Se local, em filename.
  let fileUrl = '';
  if (process.env.CLOUDINARY_URL) {
    fileUrl = req.file.path;
  } else {
    fileUrl = `/uploads/${req.file.filename}`;
  }

  res.status(201).json({
    success: true,
    message: 'Upload realizado com sucesso.',
    data: { url: fileUrl },
  });
});

export default router;

