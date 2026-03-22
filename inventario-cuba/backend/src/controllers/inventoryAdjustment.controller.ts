/**
 * Controller de ajustes de inventario.
 */

import { Response }  from 'express';
import { Prisma }    from '.prisma/client';
import { prisma }    from '../lib/prisma';
import type { AuthRequest, ApiResponse } from '../types';

export async function createAdjustment(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const {
    productId, productName, type, quantity,
    previousStock, newStock, cost, totalCost, reason, note,
  } = req.body;

  // Verificar que el producto pertenece al usuario
  const product = await prisma.product.findFirst({
    where: { id: productId, userId: req.user!.id },
  });

  if (!product) {
    res.status(404).json({
      success: false,
      error:   'Producto no encontrado.',
    });
    return;
  }

  const adjustment = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const newAdj = await tx.inventoryAdjustment.create({
        data: {
          productId,
          productName,
          type,
          quantity,
          previousStock,
          newStock,
          cost:      cost      ?? null,
          totalCost: totalCost ?? null,
          reason,
          note:      note      ?? null,
          cashierId: req.user!.id,
        },
      });

      // Actualizar stock del producto
      await tx.product.update({
        where: { id: productId },
        data:  { stock: newStock },
      });

      return newAdj;
    }
  );

  res.status(201).json({
    success: true,
    message: 'Ajuste registrado correctamente.',
    data:    adjustment,
  });
}

export async function getAdjustments(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const page      = parseInt(req.query.page      as string) || 1;
  const limit     = parseInt(req.query.limit     as string) || 50;
  const skip      = (page - 1) * limit;
  const productId = req.query.productId as string | undefined;

  const where: Prisma.InventoryAdjustmentWhereInput = {
    cashierId: req.user!.id,
    ...(productId && { productId }),
  };

  const [adjustments, total] = await Promise.all([
    prisma.inventoryAdjustment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.inventoryAdjustment.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items:      adjustments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}