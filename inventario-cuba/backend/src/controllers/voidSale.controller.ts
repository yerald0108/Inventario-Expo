/**
 * Controller de anulaciones de venta.
 */

import { Response }  from 'express';
import { Prisma }    from '.prisma/client';
import { prisma }    from '../lib/prisma';
import type { AuthRequest, ApiResponse } from '../types';

export async function createVoidSale(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { saleId, reason, totalVoided, items } = req.body;

  // Verificar que la venta pertenece al usuario
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, cashierId: req.user!.id },
  });

  if (!sale) {
    res.status(404).json({
      success: false,
      error:   'Venta no encontrada.',
    });
    return;
  }

  const voidSale = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const newVoidSale = await tx.voidSale.create({
        data: {
          saleId,
          reason,
          totalVoided: totalVoided ?? 0,
          cashierId:   req.user!.id,
          items: {
            create: (items ?? []).map((item: any) => ({
              saleItemId:  item.saleItemId,
              productId:   item.productId,
              productName: item.productName,
              quantity:    item.quantity,
              price:       item.price,
              subtotal:    item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // Restaurar stock de los productos anulados
      for (const item of items ?? []) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { stock: { increment: item.quantity } },
        });
      }

      return newVoidSale;
    }
  );

  res.status(201).json({
    success: true,
    message: 'Venta anulada correctamente.',
    data:    voidSale,
  });
}

export async function getVoidSalesBySale(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const voidSales = await prisma.voidSale.findMany({
    where:   { saleId: req.params.saleId, cashierId: req.user!.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: voidSales });
}