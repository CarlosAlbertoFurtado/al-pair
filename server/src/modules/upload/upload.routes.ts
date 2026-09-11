// ══════════════════════════════════════════════════════════════
// Upload Route
// Fluxos beta:
// - post-image: imagens seguras para publicações
// - avatar: foto pessoal com validação de rosto quando disponível
// ══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { authenticate } from '../../middleware/authenticate.js';
import { AppError } from '../../shared/errors/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new AppError('Use uma imagem JPEG, PNG ou WEBP.', 415));
  },
});

type ImageUploadOptions = {
  folder: string;
  width: number;
  height?: number;
  maxSizeMb: number;
  requireFace?: boolean;
};

function assertFile(file: Express.Multer.File | undefined, maxSizeMb: number) {
  if (!file) throw new AppError('Nenhuma imagem enviada.', 400);
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new AppError(`Imagem muito grande. Envie uma foto de até ${maxSizeMb}MB.`, 413);
  }
}

async function normalizeImage(buffer: Buffer, options: ImageUploadOptions) {
  const image = sharp(buffer, { failOn: 'error' });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new AppError('Arquivo de imagem inválido.', 422);
  }

  return image
    .rotate()
    .resize(options.width, options.height, {
      fit: options.height ? 'cover' : 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

function uploadToCloudinary(buffer: Buffer, options: ImageUploadOptions) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: 'image',
        format: 'jpg',
        faces: options.requireFace,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary não retornou resultado.'));
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function saveLocally(buffer: Buffer, folder: string) {
  const uploadDir = path.join(__dirname, '../../../../uploads', folder);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.jpg`;
  await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

async function handleImageUpload(req: Request, res: Response, options: ImageUploadOptions) {
  const file = req.file;
  assertFile(file, options.maxSizeMb);

  const normalized = await normalizeImage(file!.buffer, options);
  let url = '';
  let faceCheck = 'unavailable';

  if (process.env.CLOUDINARY_URL) {
    const result = await uploadToCloudinary(normalized, options);
    const faces = Array.isArray(result.faces) ? result.faces : [];
    faceCheck = options.requireFace ? 'checked' : 'not_required';

    if (options.requireFace && faces.length === 0) {
      throw new AppError('A foto de perfil precisa mostrar uma pessoa com o rosto visível.', 422);
    }

    url = result.secure_url;
  } else {
    url = await saveLocally(normalized, options.folder);
  }

  res.status(201).json({
    success: true,
    message: 'Upload realizado com sucesso.',
    data: { url, faceCheck },
  });
}

router.post('/post-image', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  await handleImageUpload(req, res, {
    folder: 'aupairconnect/posts',
    width: 1600,
    maxSizeMb: 8,
  });
});

router.post('/avatar', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  await handleImageUpload(req, res, {
    folder: 'aupairconnect/avatars',
    width: 512,
    height: 512,
    maxSizeMb: 3,
    requireFace: true,
  });
});

// Legado: mantém compatibilidade com telas antigas, mas já usa as regras de imagem de post.
router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  await handleImageUpload(req, res, {
    folder: 'aupairconnect/posts',
    width: 1600,
    maxSizeMb: 8,
  });
});

export default router;
