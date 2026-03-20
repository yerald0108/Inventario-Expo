import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  description: z.string().max(500).optional(),
  price: z
    .number()
    .min(0, 'El precio no puede ser negativo'),
  cost: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .default(0),
  stock: z
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .default(0),
  minStock: z
    .number()
    .int()
    .min(0)
    .default(2),
  category: z
    .string()
    .min(1, 'La categoría es requerida')
    .default('general'),
  barcode: z.string().optional(),
  unit: z.string().default('unidad'),
  imageUri: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
  id: z.string().cuid('ID de producto inválido'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;