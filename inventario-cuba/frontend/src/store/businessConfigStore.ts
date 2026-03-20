/**
 * Store de configuración del negocio con Zustand.
 * Persiste en SQLite — funciona offline.
 */

import { create } from 'zustand';
import {
  getBusinessConfig,
  saveBusinessConfig,
} from '../lib/businessConfigRepository';
import type { BusinessConfig } from '../types';

interface BusinessConfigState {
  config:    BusinessConfig;
  isLoading: boolean;
  isSaving:  boolean;
  error:     string | null;

  loadConfig:  () => Promise<void>;
  saveConfig:  (config: BusinessConfig) => Promise<void>;
  clearError:  () => void;
}

const DEFAULT_CONFIG: BusinessConfig = {
  businessName:    'Mi Negocio',
  currency:        'CUP',
  currencySymbol:  '$',
  taxPercent:      0,
  address:         null,
  phone:           null,
  openTime:        '08:00',
  closeTime:       '20:00',
  defaultCategory: 'general',
  lowStockAlert:   2,
  receiptFooter:   null,
};

export const useBusinessConfigStore = create<BusinessConfigState>((set) => ({
  config:    DEFAULT_CONFIG,
  isLoading: false,
  isSaving:  false,
  error:     null,

  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await getBusinessConfig();
      set({ config, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar configuración',
      });
    }
  },

  saveConfig: async (config: BusinessConfig) => {
    set({ isSaving: true, error: null });
    try {
      await saveBusinessConfig(config);
      set({ config, isSaving: false });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Error al guardar configuración',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));