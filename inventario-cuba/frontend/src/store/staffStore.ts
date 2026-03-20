/**
 * Store de gestión de cajeros/empleados.
 * El dueño puede crear, editar y desactivar cajeros.
 */

import { create } from 'zustand';
import { authApi } from '../services/api';
import type { StaffMember } from '../types';

interface StaffState {
  staff:     StaffMember[];
  isLoading: boolean;
  isSaving:  boolean;
  error:     string | null;

  loadStaff:    () => Promise<void>;
  createStaff:  (data: CreateStaffData) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  clearError:   () => void;
}

export interface CreateStaffData {
  name:     string;
  email:    string;
  password: string;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff:     [],
  isLoading: false,
  isSaving:  false,
  error:     null,

  /**
   * Carga la lista de cajeros desde el backend.
   */
  loadStaff: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.me();
      // Por ahora cargamos solo el perfil del dueño
      // En una versión futura se cargará la lista completa del negocio
      const owner = response.data;
      set({
        staff: [{
          id:           owner.id,
          name:         owner.name,
          email:        owner.email,
          role:         owner.role,
          businessName: owner.businessName ?? null,
          isActive:     true,
          createdAt:    owner.createdAt,
        }],
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar empleados',
      });
    }
  },

  /**
   * Crea un nuevo cajero en el servidor.
   */
  createStaff: async (data: CreateStaffData) => {
    set({ isSaving: true, error: null });
    try {
      const response = await authApi.registerCashier(data);
      const newStaff = response.data.user;

      set(state => ({
        staff: [...state.staff, {
          id:           newStaff.id,
          name:         newStaff.name,
          email:        newStaff.email,
          role:         'cashier' as const,
          businessName: newStaff.businessName ?? null,
          isActive:     true,
          createdAt:    newStaff.createdAt,
        }],
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Error al crear cajero',
      });
      throw error;
    }
  },

  /**
   * Activa o desactiva un cajero.
   */
  toggleActive: async (id: string, isActive: boolean) => {
    set(state => ({
      staff: state.staff.map(s =>
        s.id === id ? { ...s, isActive } : s
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));