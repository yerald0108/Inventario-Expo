import { z } from 'zod';

export const createSaleSchema = z.object({
  items: z
    .array(z.object({
      productId:   z.string().cuid('ID de producto inválido'),
      quantity:    z.number().int().min(1, 'La cantidad mínima es 1'),
      price:       z.number().min(0),
      cost:        z.number().min(0).default(0),
      productName: z.string().min(1),
    }))
    .min(1, 'La venta debe tener al menos un producto'),
  paymentMethod: z.enum(['cash', 'card', 'transfer']).default('cash'),
  discount:      z.number().min(0).default(0),
  note:          z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;