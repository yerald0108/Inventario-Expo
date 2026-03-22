/**
 * Controller de cierres de caja.
 */

import { Response }  from 'express';
import { Prisma }    from '.prisma/client';
import { prisma }    from '../lib/prisma';
import type { AuthRequest, ApiResponse } from '../types';

export async function createCashClosing(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const {
    date, openingAmount, closingAmount, expectedAmount,
    difference, totalSales, totalCash, totalCard,
    totalTransfer, salesCount, note,
  } = req.body;

  const closing = await prisma.cashClosing.create({
    data: {
      date,
      openingAmount:  openingAmount  ?? 0,
      closingAmount:  closingAmount  ?? 0,
      expectedAmount: expectedAmount ?? 0,
      difference:     difference     ?? 0,
      totalSales:     totalSales     ?? 0,
      totalCash:      totalCash      ?? 0,
      totalCard:      totalCard      ?? 0,
      totalTransfer:  totalTransfer  ?? 0,
      salesCount:     salesCount     ?? 0,
      note:           note           ?? null,
      userId:         req.user!.id,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Cierre de caja registrado.',
    data:    closing,
  });
}

export async function getCashClosings(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const skip  = (page - 1) * limit;

  const where: Prisma.CashClosingWhereInput = {
    userId: req.user!.id,
  };

  const [closings, total] = await Promise.all([
    prisma.cashClosing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.cashClosing.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items:      closings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}