/**
 * Store de ventas con Zustand + SQLite.
 * Lee de SQLite primero, sincroniza con servidor en background.
 */

import { create } from 'zustand';
import { salesApi } from '../services/api';
import {
  getSales,
  getTodaySummary as dbGetTodaySummary,
} from '../lib/saleRepository';
import type { Sale } from '../types';

interface DaySummary {
  salesCount:    number;
  totalAmount:   number;
  totalCash:     number;
  totalCard:     number;
  totalTransfer: number;
  date:          string;
}

interface SaleState {
  sales:            Sale[];
  todaySummary:     DaySummary | null;
  isLoading:        boolean;
  isLoadingSummary: boolean;
  error:            string | null;
  currentPage:      number;
  totalPages:       number;
  dateFrom:         string | null;
  dateTo:           string | null;

  loadSales:        (reset?: boolean) => Promise<void>;
  loadMoreSales:    () => Promise<void>;
  loadTodaySummary: () => Promise<void>;
  setDateFilter:    (from: string | null, to: string | null) => void;
  clearError:       () => void;
  getSalesByDate:   () => Record<string, Sale[]>;
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales:            [],
  todaySummary:     null,
  isLoading:        false,
  isLoadingSummary: false,
  error:            null,
  currentPage:      1,
  totalPages:       1,
  dateFrom:         null,
  dateTo:           null,

  /**
   * Carga ventas desde SQLite primero, luego actualiza desde servidor.
   */
  loadSales: async (reset = true) => {
    set({ isLoading: true, error: null });
    try {
      const { dateFrom, dateTo } = get();
      const page = reset ? 1 : get().currentPage;

      // 1. Cargar desde SQLite (sin red)
      const localSales = await getSales({ dateFrom, dateTo, page, limit: 20 });
      set({
        sales:       reset ? localSales : [...get().sales, ...localSales],
        currentPage: page,
        isLoading:   false,
      });

      // 2. Actualizar desde servidor en background
      try {
        const response = await salesApi.getAll({
          page,
          limit:    20,
          dateFrom: dateFrom ?? undefined,
          dateTo:   dateTo   ?? undefined,
        });
        const serverSales = response.data.items.map((s: any) => ({
          ...s,
          syncStatus: 'synced' as const,
        }));
        set({
          sales:      reset ? serverSales : [...get().sales, ...serverSales],
          totalPages: response.data.totalPages,
        });
      } catch {
        // Sin red — usar datos de SQLite
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar ventas',
      });
    }
  },

  loadMoreSales: async () => {
    const { currentPage, totalPages, isLoading } = get();
    if (isLoading || currentPage >= totalPages) return;
    set({ currentPage: currentPage + 1 });
    await get().loadSales(false);
  },

  /**
   * Carga resumen del día desde SQLite primero.
   */
  loadTodaySummary: async () => {
    set({ isLoadingSummary: true });
    try {
      // 1. SQLite primero
      const local = await dbGetTodaySummary();
      set({
        todaySummary: {
          salesCount:    local.salesCount,
          totalAmount:   local.totalAmount,
          totalCash:     local.totalCash,
          totalCard:     local.totalCard,
          totalTransfer: local.totalTransfer,
          date:          new Date().toISOString().split('T')[0],
        },
        isLoadingSummary: false,
      });

      // 2. Actualizar desde servidor
      try {
        const response = await salesApi.getTodaySummary();
        set({ todaySummary: response.data });
      } catch {}
    } catch {
      set({ isLoadingSummary: false });
    }
  },

  setDateFilter: (from, to) => set({ dateFrom: from, dateTo: to }),
  clearError:    ()         => set({ error: null }),

  getSalesByDate: () => {
    const { sales } = get();
    return sales.reduce((groups: Record<string, Sale[]>, sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(sale);
      return groups;
    }, {});
  },
}));