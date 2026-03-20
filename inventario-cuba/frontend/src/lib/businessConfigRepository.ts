/**
 * Repositorio de configuración del negocio en SQLite.
 * Usa un modelo clave-valor simple y flexible.
 */

import { execSQL, querySQL } from './database';
import type { BusinessConfig } from '../types';

const DEFAULTS: BusinessConfig = {
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

/**
 * Carga toda la configuración del negocio desde SQLite.
 */
export async function getBusinessConfig(): Promise<BusinessConfig> {
  const rows = await querySQL<{ key: string; value: string }>(
    `SELECT key, value FROM business_config`
  );

  const config = { ...DEFAULTS };

  rows.forEach(row => {
    switch (row.key) {
      case 'businessName':    config.businessName    = row.value; break;
      case 'currency':        config.currency        = row.value; break;
      case 'currencySymbol':  config.currencySymbol  = row.value; break;
      case 'taxPercent':      config.taxPercent      = parseFloat(row.value) || 0; break;
      case 'address':         config.address         = row.value || null; break;
      case 'phone':           config.phone           = row.value || null; break;
      case 'openTime':        config.openTime        = row.value; break;
      case 'closeTime':       config.closeTime       = row.value; break;
      case 'defaultCategory': config.defaultCategory = row.value; break;
      case 'lowStockAlert':   config.lowStockAlert   = parseInt(row.value) || 2; break;
      case 'receiptFooter':   config.receiptFooter   = row.value || null; break;
    }
  });

  return config;
}

/**
 * Guarda un valor de configuración.
 */
export async function setConfigValue(
  key:   keyof BusinessConfig,
  value: string
): Promise<void> {
  await execSQL(
    `INSERT OR REPLACE INTO business_config (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

/**
 * Guarda toda la configuración de una vez.
 */
export async function saveBusinessConfig(
  config: BusinessConfig
): Promise<void> {
  const entries: [keyof BusinessConfig, string][] = [
    ['businessName',    config.businessName],
    ['currency',        config.currency],
    ['currencySymbol',  config.currencySymbol],
    ['taxPercent',      String(config.taxPercent)],
    ['address',         config.address         ?? ''],
    ['phone',           config.phone           ?? ''],
    ['openTime',        config.openTime],
    ['closeTime',       config.closeTime],
    ['defaultCategory', config.defaultCategory],
    ['lowStockAlert',   String(config.lowStockAlert)],
    ['receiptFooter',   config.receiptFooter   ?? ''],
  ];

  for (const [key, value] of entries) {
    await setConfigValue(key, value);
  }
}