/**
 * Controller de productos.
 * CRUD completo con validación y paginación.
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma';
import type { AuthRequest, ApiResponse } from '../types';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validators';

/**
 * GET /api/products
 * Lista productos del usuario con búsqueda y filtros.
 */
export async function getProducts(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const userId   = req.user!.id;
  const search   = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const page     = parseInt(req.query.page as string) || 1;
  const limit    = parseInt(req.query.limit as string) || 50;
  const skip     = (page - 1) * limit;

  // Construir filtros dinámicos
  const where: any = {
    userId,
    isActive: true,
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    }),
    ...(category && { category }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items:      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /api/products/:id
 * Obtiene un producto por ID.
 */
export async function getProductById(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const product = await prisma.product.findFirst({
    where: {
      id:     req.params.id,
      userId: req.user!.id,
    },
  });

  if (!product) {
    res.status(404).json({
      success: false,
      error: 'Producto no encontrado.',
    });
    return;
  }

  res.json({ success: true, data: product });
}

/**
 * POST /api/products
 * Crea un nuevo producto.
 */
export async function createProduct(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const input = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data: {
      ...input,
      userId: req.user!.id,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Producto creado correctamente.',
    data: product,
  });
}

/**
 * PATCH /api/products/:id
 * Actualiza un producto existente.
 */
export async function updateProduct(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const input = updateProductSchema.parse(req.body);

  // Verificar que el producto pertenece al usuario
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      error: 'Producto no encontrado.',
    });
    return;
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data:  input,
  });

  res.json({
    success: true,
    message: 'Producto actualizado correctamente.',
    data: product,
  });
}

/**
 * DELETE /api/products/:id
 * Desactiva un producto (soft delete).
 */
export async function deleteProduct(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      error: 'Producto no encontrado.',
    });
    return;
  }

  // Soft delete — marcar como inactivo en lugar de eliminar
  await prisma.product.update({
    where: { id: req.params.id },
    data:  { isActive: false },
  });

  res.json({
    success: true,
    message: 'Producto eliminado correctamente.',
  });
}

/**
 * GET /api/products/categories
 * Lista todas las categorías únicas del usuario.
 */
export async function getCategories(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const categories = await prisma.product.findMany({
    where:   { userId: req.user!.id, isActive: true },
    select:  { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  res.json({
    success: true,
    data: categories.map((c: { category: string }) => c.category),
  });
}