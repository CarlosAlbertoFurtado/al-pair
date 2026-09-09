import { z } from 'zod';

export const vaultItemSchema = z.object({
  type: z.enum(['PASSPORT', 'VISA', 'INSURANCE', 'DS2019', 'CONTRACT', 'OTHER'], {
    required_error: 'O tipo de documento é obrigatório',
    invalid_type_error: 'Tipo de documento inválido',
  }),
  label: z.string().min(2, 'O nome do documento deve ter pelo menos 2 caracteres').max(100),
  fileUrl: z.string().url('A URL do arquivo deve ser válida'),
  fileSizeKb: z.number().positive('Tamanho de arquivo inválido'),
  mimeType: z.string().min(3),
});
