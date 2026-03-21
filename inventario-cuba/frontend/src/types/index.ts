/**
 * Tipos globales compartidos en toda la app.
 */

// ─── Usuario autenticado ──────────────────────────────────────────────────────
export interface User {
  id:           string;
  name:         string;
  email:        string;
  role:         'owner' | 'cashier';
  businessName: string | null;
}

// ─── Respuesta estándar de la API ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}

// ─── Producto ─────────────────────────────────────────────────────────────────
export interface Product {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  cost:        number;
  stock:       number;
  minStock:    number;
  category:    string;
  barcode:     string | null;
  unit:        string;
  isActive:    boolean;
  imageUri:    string | null;
  syncStatus:  'pending' | 'synced' | 'error';
  serverId:    string | null;
  createdAt:   string;
  updatedAt:   string;
}

// ─── Venta ────────────────────────────────────────────────────────────────────
export interface SaleItem {
  id:          string;
  productId:   string;
  productName: string;
  price:       number;
  cost:        number;
  quantity:    number;
  subtotal:    number;
}

export interface Sale {
  id:            string;
  total:         number;
  subtotal:      number;
  discount:      number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  note:          string | null;
  items:         SaleItem[];
  syncStatus:    'pending' | 'synced' | 'error';
  createdAt:     string;
}

// ─── Carrito ──────────────────────────────────────────────────────────────────
export interface CartItem {
  product:  Product;
  quantity: number;
}

// ─── Cierre de caja ───────────────────────────────────────────────────────────
export interface CashClosing {
  id:             string;
  date:           string;
  openingAmount:  number;
  closingAmount:  number;
  expectedAmount: number;
  difference:     number;
  totalSales:     number;
  totalCash:      number;
  totalCard:      number;
  totalTransfer:  number;
  salesCount:     number;
  note:           string | null;
  createdAt:      string;
}

// ─── Parámetros de navegación ─────────────────────────────────────────────────
export type RootStackParamList = {
  Auth:  undefined;
  Main:  undefined;
};

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products:  undefined;
  POS:       undefined;
  Sales:     undefined;
  Settings:  undefined;
};

export type SettingsStackParamList = {
  SettingsHome:        undefined;
  Sync:                undefined;
  CashClosing:         undefined;
  CashClosingHistory:  undefined;
  StaffList:           undefined;
  StaffForm:           { staffId?: string };
  Reports:             undefined;
  InventoryAdjustment: { productId?: string };
  AdjustmentHistory:   undefined;
  Backup:              undefined;
  BusinessConfig:      undefined;
  NotificationsConfig: undefined;
  Profile:             undefined;
};

export type ProductsStackParamList = {
  ProductList:   undefined;
  ProductForm:   { productId?: string };
  ProductDetail: { productId: string };
};

export type SalesStackParamList = {
  SaleList:   undefined;
  SaleDetail: { saleId: string };
  VoidSale:   { saleId: string };
};

// ─── Anulación de venta ───────────────────────────────────────────────────────
export interface VoidSale {
  id:          string;
  saleId:      string;
  reason:      string;
  items:       VoidSaleItem[];
  totalVoided: number;
  createdAt:   string;
}

export interface VoidSaleItem {
  saleItemId:  string;
  productId:   string;
  productName: string;
  quantity:    number;     // Cantidad a anular (puede ser parcial)
  price:       number;
  subtotal:    number;
}

export interface StaffMember {
  id:           string;
  name:         string;
  email:        string;
  role:         'owner' | 'cashier';
  businessName: string | null;
  isActive:     boolean;
  createdAt:    string;
}

// ─── Ajuste de inventario ─────────────────────────────────────────────────────
export interface InventoryAdjustment {
  id:          string;
  productId:   string;
  productName: string;
  type:        'entrada' | 'salida' | 'ajuste';
  quantity:    number;      // positivo = entrada, negativo = salida
  previousStock: number;
  newStock:    number;
  cost:        number | null; // costo unitario del lote entrante
  totalCost:   number | null;
  reason:      string;
  note:        string | null;
  syncStatus:  'pending' | 'synced' | 'error';
  createdAt:   string;
}

// ─── Configuración del negocio ────────────────────────────────────────────────
export interface BusinessConfig {
  businessName:   string;
  currency:       string;
  currencySymbol: string;
  taxPercent:     number;
  address:        string | null;
  phone:          string | null;
  openTime:       string;
  closeTime:      string;
  defaultCategory: string;
  lowStockAlert:  number;
  receiptFooter:  string | null;
}