/**
 * Store de productos con Zustand + SQLite.
 * OFFLINE-FIRST real: SQLite es la fuente de verdad.
 * El servidor es solo sincronización secundaria.
 */

import { create } from 'zustand';
import { productsApi } from '../services/api';
import {
  getAllProducts,
  getCategories,
  insertProduct,
  updateProductInDB,
  deleteProductInDB,
  decrementStock,
  upsertProductFromServer,
  markProductSynced,
} from '../lib/productRepository';
import { enqueueOperation } from '../lib/syncQueueRepository';
import type { Product } from '../types';

function generateId(): string {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface ProductState {
  products:         Product[];
  isLoading:        boolean;
  error:            string | null;
  searchQuery:      string;
  selectedCategory: string | null;
  categories:       string[];

  loadProducts:        () => Promise<void>;
  loadCategories:      () => Promise<void>;
  createProduct:       (data: CreateProductData) => Promise<Product>;
  updateProduct:       (id: string, data: Partial<CreateProductData>) => Promise<void>;
  deleteProduct:       (id: string) => Promise<void>;
  syncFromServer:      () => Promise<void>;
  setSearchQuery:      (query: string) => void;
  setCategory:         (category: string | null) => void;
  clearError:          () => void;
  getFilteredProducts: () => Product[];
  getLowStockProducts: () => Product[];
}

export interface CreateProductData {
  name:         string;
  description?: string;
  price:        number;
  cost:         number;
  stock:        number;
  minStock:     number;
  category:     string;
  barcode?:     string;
  unit:         string;
  imageUri?:    string;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products:         [],
  isLoading:        false,
  error:            null,
  searchQuery:      '',
  selectedCategory: null,
  categories:       [],

  /**
   * Carga productos desde SQLite (instantáneo, sin red).
   * Luego sincroniza con servidor en background.
   */
  loadProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. SQLite primero — sin esperar red
      const local = await getAllProducts();
      set({ products: local, isLoading: false });

      // 2. Sync con servidor en background — no bloquea UI
      get().syncFromServer().catch(err =>
        console.log('[ProductStore] Sync background falló:', err.message)
      );
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar productos',
      });
    }
  },

  /**
   * Descarga productos del servidor y los guarda en SQLite.
   * Aplica last-write-wins para resolver conflictos.
   */
  syncFromServer: async () => {
    try {
      const response = await productsApi.getAll({ limit: 500 });
      for (const sp of response.data.items) {
        await upsertProductFromServer(sp);
      }
      // Recargar desde SQLite después del upsert
      const updated = await getAllProducts();
      set({ products: updated });
    } catch {
      // Sin conexión — usar datos locales
    }
  },

  loadCategories: async () => {
    try {
      const cats = await getCategories();
      set({ categories: cats });
    } catch {}
  },

  /**
   * Crea un producto:
   * 1. Guarda en SQLite inmediatamente
   * 2. Agrega a la cola persistente de sincronización
   * 3. Actualiza el estado en memoria
   * 4. Intenta subir al servidor si hay red
   */
  createProduct: async (data: CreateProductData): Promise<Product> => {
    const now     = new Date().toISOString();
    const localId = generateId();

    const newProduct: Product = {
      id:          localId,
      serverId:    null,
      name:        data.name,
      description: data.description ?? null,
      price:       data.price,
      cost:        data.cost,
      stock:       data.stock,
      minStock:    data.minStock,
      category:    data.category,
      barcode:     data.barcode ?? null,
      unit:        data.unit,
      isActive:    true,
      imageUri:    null,
      syncStatus:  'pending',
      createdAt:   now,
      updatedAt:   now,
    };

    // 1. Guardar en SQLite
    await insertProduct(newProduct);

    // 2. Encolar en SQLite (persiste entre sesiones)
    await enqueueOperation('create_product', localId, data);

    // 3. Actualizar memoria
    set(state => ({ products: [newProduct, ...state.products] }));

    // 4. Intentar subir al servidor
    try {
      const response = await productsApi.create(data);
      const serverId = response.data.id;

      await markProductSynced(localId, serverId);

      const synced: Product = { ...newProduct, serverId, syncStatus: 'synced' };
      set(state => ({
        products: state.products.map(p => p.id === localId ? synced : p),
      }));
      return synced;
    } catch {
      // Sin red — queda pendiente en cola SQLite
      return newProduct;
    }
  },

  /**
   * Actualiza un producto en SQLite y encola la sincronización.
   */
  updateProduct: async (id: string, data: Partial<CreateProductData>) => {
    const now     = new Date().toISOString();
    const product = get().products.find(p => p.id === id);

    // 1. Actualizar en SQLite
    await updateProductInDB(id, {
      ...data,
      syncStatus: 'pending',
      updatedAt:  now,
    });

    // 2. Encolar en SQLite
    const serverId = product?.serverId;
    await enqueueOperation(
      'update_product',
      serverId ?? id,
      data
    );

    // 3. Actualizar memoria
    set(state => ({
      products: state.products.map(p =>
        p.id === id
          ? { ...p, ...data, syncStatus: 'pending' as const, updatedAt: now }
          : p
      ),
    }));

    // 4. Intentar con servidor
    try {
      if (serverId && !serverId.startsWith('local_')) {
        await productsApi.update(serverId, data);
        await updateProductInDB(id, { syncStatus: 'synced' });
        set(state => ({
          products: state.products.map(p =>
            p.id === id ? { ...p, syncStatus: 'synced' as const } : p
          ),
        }));
      }
    } catch {}
  },

  /**
   * Elimina (soft delete) un producto.
   */
  deleteProduct: async (id: string) => {
    const product  = get().products.find(p => p.id === id);
    const serverId = product?.serverId;

    // 1. Soft delete en SQLite
    await deleteProductInDB(id);

    // 2. Encolar
    await enqueueOperation('delete_product', serverId ?? id, { id: serverId ?? id });

    // 3. Quitar de memoria
    set(state => ({
      products: state.products.filter(p => p.id !== id),
    }));

    // 4. Intentar con servidor
    try {
      if (serverId && !serverId.startsWith('local_')) {
        await productsApi.delete(serverId);
      }
    } catch {}
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategory:    (cat)   => set({ selectedCategory: cat }),
  clearError:     ()      => set({ error: null }),

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    return products.filter(p => {
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery);
      const matchCat = !selectedCategory || p.category === selectedCategory;
      return matchSearch && matchCat && p.isActive;
    });
  },

  getLowStockProducts: () =>
    get().products.filter(p => p.isActive && p.stock <= p.minStock),
}));