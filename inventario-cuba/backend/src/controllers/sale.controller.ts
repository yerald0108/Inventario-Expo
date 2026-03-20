import { Response } from 'express';
import { prisma } from '../lib/prisma';
import type { AuthRequest, ApiResponse } from '../types';
import { createSaleSchema } from '../validators/sale.validators';

export async function createSale(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const input = createSaleSchema.parse(req.body);

  const subtotal = input.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity, 0
  );
  const total = subtotal - input.discount;

  const sale = await prisma.$transaction(async (tx: any) => {
    for (const item of input.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, userId: req.user!.id },
      });
      if (!product) {
        throw new Error(`Producto ${item.productName} no encontrado.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`
        );
      }
    }

    const newSale = await tx.sale.create({
      data: {
        total,
        subtotal,
        discount:      input.discount,
        paymentMethod: input.paymentMethod as any,
        note:          input.note,
        cashierId:     req.user!.id,
        items: {
          create: input.items.map((item: any) => ({
            productId:   item.productId,
            productName: item.productName,
            quantity:    item.quantity,
            price:       item.price,
            cost:        item.cost,
            subtotal:    item.price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { stock: { decrement: item.quantity } },
      });
    }

    return newSale;
  });

  res.status(201).json({
    success: true,
    message: 'Venta registrada correctamente.',
    data: sale,
  });
}

export async function getSales(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const page     = parseInt(req.query.page as string) || 1;
  const limit    = parseInt(req.query.limit as string) || 20;
  const skip     = (page - 1) * limit;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo   = req.query.dateTo   as string | undefined;

  const where: any = {
    cashierId: req.user!.id,
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo   && { lte: new Date(dateTo + 'T23:59:59') }),
      },
    } : {}),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include:  { items: true },
      orderBy:  { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items:      sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getSaleById(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const sale = await prisma.sale.findFirst({
    where: {
      id:        req.params.id,
      cashierId: req.user!.id,
    },
    include: { items: true },
  });

  if (!sale) {
    res.status(404).json({ success: false, error: 'Venta no encontrada.' });
    return;
  }

  res.json({ success: true, data: sale });
}

export async function getTodaySummary(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: {
      cashierId: req.user!.id,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const totalAmount   = sales.reduce((sum: number, s: any) => sum + s.total, 0);
  const totalCash     = sales.filter((s: any) => s.paymentMethod === 'cash')
                             .reduce((sum: number, s: any) => sum + s.total, 0);
  const totalCard     = sales.filter((s: any) => s.paymentMethod === 'card')
                             .reduce((sum: number, s: any) => sum + s.total, 0);
  const totalTransfer = sales.filter((s: any) => s.paymentMethod === 'transfer')
                             .reduce((sum: number, s: any) => sum + s.total, 0);

  res.json({
    success: true,
    data: {
      salesCount: sales.length,
      totalAmount,
      totalCash,
      totalCard,
      totalTransfer,
      date: today.toISOString().split('T')[0],
    },
  });
}