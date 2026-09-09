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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

// Garante que a pasta uploads existe
const uploadDir = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/upload - Upload de imagem
router.post('/', authenticate, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    return;
  }

  // Retorna a URL pública do arquivo
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    success: true,
    message: 'Upload realizado com sucesso.',
    data: { url: fileUrl },
  });
});

export default router;
