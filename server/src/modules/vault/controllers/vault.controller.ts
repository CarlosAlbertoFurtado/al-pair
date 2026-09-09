// ══════════════════════════════════════════════════════════════
// Vault Controller
// ══════════════════════════════════════════════════════════════

import { Response } from 'express';
import { vaultService } from '../services/vault.service.js';
import type { AuthRequest } from '../../../middleware/authenticate.js';

export const vaultController = {
  async listItems(req: AuthRequest, res: Response): Promise<void> {
    const items = await vaultService.listItems(req.userId!);
    res.status(200).json({ success: true, data: { items } });
  },

  async addItem(req: AuthRequest, res: Response): Promise<void> {
    const { type, label, fileUrl, fileSizeKb, mimeType } = req.body;
    const item = await vaultService.addItem(
      req.userId!,
      type,
      label,
      fileUrl,
      fileSizeKb,
      mimeType
    );
    res.status(201).json({ success: true, data: { item } });
  },

  async deleteItem(req: AuthRequest, res: Response): Promise<void> {
    await vaultService.deleteItem((req.params.id as string), req.userId!);
    res.status(200).json({ success: true, message: 'Documento removido do cofre com segurança.' });
  },
};
