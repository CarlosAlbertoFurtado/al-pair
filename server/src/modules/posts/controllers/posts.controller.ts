// ══════════════════════════════════════════════════════════════
// Posts Controller - Camada HTTP do Feed e Rematch
// ══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { postsService } from '../services/posts.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const postsController = {
  async getFeed(req: AuthRequest, res: Response): Promise<void> {
    const { type, cursor, limit, authorId } = req.query;

    const result = await postsService.getFeed(
      {
        type: type as any,
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        authorId: authorId as string,
      },
      req.userId
    );

    res.status(200).json({ success: true, data: result });
  },

  async createPost(req: AuthRequest, res: Response): Promise<void> {
    const post = await postsService.createPost(req.userId!, req.body);
    res.status(201).json({ success: true, data: { post } });
  },

  async deletePost(req: AuthRequest, res: Response): Promise<void> {
    await postsService.deletePost((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, message: 'Post removido.' });
  },

  async toggleLike(req: AuthRequest, res: Response): Promise<void> {
    const result = await postsService.toggleLike((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, data: result });
  },

  async getComments(req: AuthRequest, res: Response): Promise<void> {
    const { cursor } = req.query;
    const result = await postsService.getComments((req.params.id as string), cursor as string);
    res.status(200).json({ success: true, data: result });
  },

  async addComment(req: AuthRequest, res: Response): Promise<void> {
    const comment = await postsService.addComment(
      (req.params.id as string),
      req.userId!,
      req.body.content
    );
    res.status(201).json({ success: true, data: { comment } });
  },

  async toggleBookmark(req: AuthRequest, res: Response): Promise<void> {
    const result = await postsService.toggleBookmark((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, data: result });
  },

  async getBookmarks(req: AuthRequest, res: Response): Promise<void> {
    const posts = await postsService.getBookmarks(req.userId!);
    res.status(200).json({ success: true, data: { posts } });
  },
};
