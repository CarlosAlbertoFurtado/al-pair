// ══════════════════════════════════════════════════════════════
// Posts Routes
// ══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { postsController } from '../controllers/posts.controller.js';
import { authenticate, optionalAuth } from '../../../middleware/authenticate.js';
import { validate } from '../../../middleware/validate.js';
import { createPostSchema, addCommentSchema } from '../../../shared/validators/posts.validator.js';

const router = Router();

// GET /api/posts - Feed público (com dados extras se logado)
router.get('/', optionalAuth, postsController.getFeed);

// GET /api/posts/bookmarks/mine - Posts salvos (antes de /:id)
router.get('/bookmarks/mine', authenticate, postsController.getBookmarks);

// POST /api/posts - Criar post (requer auth)
router.post('/', authenticate, validate(createPostSchema), postsController.createPost);

// DELETE /api/posts/:id - Deletar post (requer auth + ser autor)
router.delete('/:id', authenticate, postsController.deletePost);

// POST /api/posts/:id/like - Curtir/Descurtir (toggle)
router.post('/:id/like', authenticate, postsController.toggleLike);

// GET /api/posts/:id/comments - Comentários de um post
router.get('/:id/comments', optionalAuth, postsController.getComments);

// POST /api/posts/:id/comments - Adicionar comentário
router.post('/:id/comments', authenticate, validate(addCommentSchema), postsController.addComment);

// POST /api/posts/:id/bookmark - Salvar/remover dos favoritos
router.post('/:id/bookmark', authenticate, postsController.toggleBookmark);

export default router;
