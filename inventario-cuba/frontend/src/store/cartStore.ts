/**
 * Store del carrito con Zustand + SQLite.
 * Las ventas se guardan en SQLite antes de intentar subir al servidor.
 */

import { create } from 'zustand';
import { salesApi } from '../services/api';
import { useProductStore } from './productStore';
import { insertSaleWithItems, markSaleSynced } from '../lib/saleRepository';
import { decrementStock }                       from '../lib/productRepository';
import { enqueueOperation }                     from '../lib/syncQueueRepository';
import type { CartItem, Product } from '../types';

function generateId(): string {
  return 'sale_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface CartState {
  items:         CartItem[];
  paymentMethod: 'cash' | 'card' | 'transfer';
  discount:      number;
  note:          string;
  isProcessing:  boolean;
  error:         string | null;

  addItem:          (product: Product) => void;
  removeItem:       (productId: string) => void;
  updateQuantity:   (productId: string, quantity: number) => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer') => void;
  setDiscount:      (discount: number) => void;
  setNote:          (note: string) => void;
  clearCart:        () => void;
  processSale:      () => Promise<string>;
  clearError:       () => void;
  getSubtotal:      () => number;
  getTotal:         () => number;
  getItemCount:     () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items:         [],
  paymentMethod: 'cash',
  discount:      0,
  note:          '',
  isProcessing:  false,
  error:         null,

  addItem: (product: Product) => {
    const { items } = get();
    const existing  = items.find(i => i.product.id === product.id);
    const currentQty = existing?.quantity ?? 0;

    if (currentQty >= product.stock) {
      set({ error: `Stock insuficiente. Solo hay ${product.stock} ${product.unit} disponibles.` });
      return;
    }

    if (existing) {
      set({
        items: items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...items, { product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set(state => ({
      items: state.items.filter(i => i.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const product = get().items.find(i => i.product.id === productId)?.product;
    if (product && quantity > product.stock) {
      set({ error: `Stock insuficiente. Solo hay ${product.stock} ${product.unit}.` });
      return;
    }
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }));
  },

  setPaymentMethod: (method)   => set({ paymentMethod: method }),
  setDiscount:      (discount) => set({ discount }),
  setNote:          (note)     => set({ note }),

  clearCart: () => set({
    items:         [],
    discount:      0,
    note:          '',
    paymentMethod: 'cash',
    error:         null,
  }),

  /**
   * Procesa la venta con persistencia real en SQLite.
   * 1. Guarda en SQLite (atómico)
   * 2. Descuenta stock en SQLite
   * 3. Encola sincronización
   * 4. Intenta subir al servidor
   */
  processSale: async (): Promise<string> => {
    const { items, paymentMethod, discount, note } = get();

    if (items.length === 0) throw new Error('El carrito está vacío');

    set({ isProcessing: true, error: null });

    const saleId   = generateId();
    const now      = new Date().toISOString();
    const subtotal = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity, 0
    );
    const total = Math.max(0, subtotal - discount);

    const saleItems = items.map(item => ({
      id:          'item_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
      productId:   item.product.id,
      productName: item.product.name,
      price:       item.product.price,
      cost:        item.product.cost,
      quantity:    item.quantity,
      subtotal:    item.product.price * item.quantity,
    }));

    try {
      // 1. Guardar venta en SQLite (transacción atómica)
      await insertSaleWithItems({
        id:            saleId,
        total,
        subtotal,
        discount,
        paymentMethod,
        note:          note || null,
        items:         saleItems,
        syncStatus:    'pending',
        createdAt:     now,
      });

      // 2. Descontar stock en SQLite
      for (const item of items) {
        await decrementStock(item.product.id, item.quantity);
      }

      // 3. Recargar productos en store
      await useProductStore.getState().loadProducts();

      // 4. Encolar sincronización en SQLite
      const productStore = useProductStore.getState();
      await enqueueOperation('create_sale', saleId, {
        items: saleItems.map(i => ({
          productId:   productStore.products.find(p => p.id === i.productId)?.serverId ?? i.productId,
          productName: i.productName,
          quantity:    i.quantity,
          price:       i.price,
          cost:        i.cost,
        })),
        paymentMethod,
        discount,
        note: note || undefined,
      });

      // 5. Intentar subir al servidor
      try {
        const response = await salesApi.create({
          items: saleItems.map(i => ({
            productId:   productStore.products.find(p => p.id === i.productId)?.serverId ?? i.productId,
            productName: i.productName,
            quantity:    i.quantity,
            price:       i.price,
            cost:        i.cost,
          })),
          paymentMethod,
          discount,
          note: note || undefined,
        });
        await markSaleSynced(saleId, response.data.id);
      } catch {
        // Sin red — queda en cola SQLite para sincronizar después
      }

      set({ isProcessing: false });
      return saleId;

    } catch (error) {
      set({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Error al procesar la venta',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  getTotal: () =>
    Math.max(0, get().getSubtotal() - get().discount),

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));