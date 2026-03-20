/**
 * Store de cierre de caja con Zustand + SQLite.
 * Los cierres ahora persisten entre sesiones.
 */

import { create } from 'zustand';
import { salesApi } from '../services/api';
import {
  insertCashClosing,
  getAllClosings,
} from '../lib/cashClosingRepository';
import { enqueueOperation } from '../lib/syncQueueRepository';
import { getTodaySummary }  from '../lib/saleRepository';
import type { CashClosing } from '../types';

function generateId(): string {
  return 'closing_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface CashClosingState {
  closings:      CashClosing[];
  isLoading:     boolean;
  isSaving:      boolean;
  error:         string | null;
  openingAmount: number;
  closingAmount: number;
  note:          string;
  todayStats: {
    totalSales:     number;
    totalCash:      number;
    totalCard:      number;
    totalTransfer:  number;
    salesCount:     number;
    expectedAmount: number;
  } | null;

  loadTodayStats:   () => Promise<void>;
  loadClosings:     () => Promise<void>;
  setOpeningAmount: (amount: number) => void;
  setClosingAmount: (amount: number) => void;
  setNote:          (note: string) => void;
  saveClosing:      () => Promise<void>;
  clearError:       () => void;
  getDifference:    () => number;
}

export const useCashClosingStore = create<CashClosingState>((set, get) => ({
  closings:      [],
  isLoading:     false,
  isSaving:      false,
  error:         null,
  openingAmount: 0,
  closingAmount: 0,
  note:          '',
  todayStats:    null,

  /**
   * Carga estadísticas del día desde SQLite primero.
   */
  loadTodayStats: async () => {
    set({ isLoading: true });
    try {
      // 1. SQLite primero
      const local = await getTodaySummary();
      set({
        todayStats: {
          totalSales:     local.totalAmount,
          totalCash:      local.totalCash,
          totalCard:      local.totalCard,
          totalTransfer:  local.totalTransfer,
          salesCount:     local.salesCount,
          expectedAmount: local.totalAmount,
        },
        isLoading: false,
      });

      // 2. Actualizar desde servidor
      try {
        const response = await salesApi.getTodaySummary();
        const data     = response.data;
        set({
          todayStats: {
            totalSales:     data.totalAmount,
            totalCash:      data.totalCash,
            totalCard:      data.totalCard,
            totalTransfer:  data.totalTransfer,
            salesCount:     data.salesCount,
            expectedAmount: data.totalAmount,
          },
        });
      } catch {}
    } catch {
      set({ isLoading: false });
    }
  },

  /**
   * Carga historial de cierres desde SQLite.
   */
  loadClosings: async () => {
    set({ isLoading: true });
    try {
      const closings = await getAllClosings();
      set({ closings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setOpeningAmount: (amount) => set({ openingAmount: amount }),
  setClosingAmount: (amount) => set({ closingAmount: amount }),
  setNote:          (note)   => set({ note }),

  /**
   * Guarda el cierre en SQLite y encola sincronización.
   */
  saveClosing: async () => {
    const { openingAmount, closingAmount, note, todayStats } = get();

    if (!todayStats) {
      set({ error: 'No hay datos del día para cerrar' });
      return;
    }

    set({ isSaving: true, error: null });

    const difference = closingAmount - todayStats.expectedAmount;
    const today      = new Date().toISOString().split('T')[0];
    const id         = generateId();

    const newClosing: CashClosing = {
      id,
      date:           today,
      openingAmount,
      closingAmount,
      expectedAmount: todayStats.expectedAmount,
      difference,
      totalSales:     todayStats.totalSales,
      totalCash:      todayStats.totalCash,
      totalCard:      todayStats.totalCard,
      totalTransfer:  todayStats.totalTransfer,
      salesCount:     todayStats.salesCount,
      note:           note || null,
      createdAt:      new Date().toISOString(),
    };

    // 1. Guardar en SQLite
    await insertCashClosing(newClosing);

    // 2. Encolar sincronización
    await enqueueOperation('create_sale', id, newClosing);

    // 3. Actualizar estado
    set(state => ({
      closings:      [newClosing, ...state.closings],
      isSaving:      false,
      openingAmount: 0,
      closingAmount: 0,
      note:          '',
    }));
  },

  clearError:    () => set({ error: null }),
  getDifference: () => {
    const { closingAmount, todayStats } = get();
    return closingAmount - (todayStats?.expectedAmount ?? 0);
  },
}));