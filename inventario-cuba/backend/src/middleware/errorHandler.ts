import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error]', error);

  // Error de validación Zod
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: error.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Error de Prisma — registro no encontrado
  if (error?.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: 'Registro no encontrado.',
    });
    return;
  }

  // Error de Prisma — unicidad
  if (error?.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: 'Ya existe un registro con esos datos.',
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development'
      ? error.message
      : 'Error interno del servidor.',
  });
}