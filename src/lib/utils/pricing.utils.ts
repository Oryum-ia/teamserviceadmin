/**
 * @file pricing.utils.ts
 * @description Pure functions for pricing calculations
 * Enterprise-grade mathematical operations with precision handling
 * Following functional programming principles: pure functions, immutability
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PriceItem {
  readonly cantidad: number;
  readonly precio_unitario: number;
  readonly descuento: number; // Percentage (0-100)
  readonly iva: number; // Percentage (0-100)
}

export interface PriceTotals {
  readonly subtotal: number;
  readonly iva: number;
  readonly total: number;
  readonly valor_revision: number;
  readonly precio_envio: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DECIMAL_PRECISION = 2;
const PERCENTAGE_MULTIPLIER = 100;

// ============================================================================
// PURE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Rounds a number to specified decimal places
 * @pure
 */
const roundToPrecision = (value: number, precision: number = DECIMAL_PRECISION): number => {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Converts percentage to decimal (19% -> 0.19)
 * @pure
 */
const percentageToDecimal = (percentage: number): number => {
  return percentage / PERCENTAGE_MULTIPLIER;
};

/**
 * Calculates subtotal before discount and tax
 * Formula: cantidad × precio_unitario
 * @pure
 */
export const calculateBaseSubtotal = (item: Pick<PriceItem, 'cantidad' | 'precio_unitario'>): number => {
  const subtotal = item.cantidad * item.precio_unitario;
  return roundToPrecision(subtotal);
};

/**
 * Calculates discount amount
 * Formula: subtotal × (descuento / 100)
 * @pure
 */
export const calculateDiscountAmount = (
  subtotal: number,
  discountPercentage: number
): number => {
  const discountDecimal = percentageToDecimal(discountPercentage);
  const discountAmount = subtotal * discountDecimal;
  return roundToPrecision(discountAmount);
};

/**
 * Calculates subtotal after discount
 * Formula: subtotal - (subtotal × descuento / 100)
 * @pure
 */
export const calculateSubtotalAfterDiscount = (item: PriceItem): number => {
  const baseSubtotal = calculateBaseSubtotal(item);
  const discountAmount = calculateDiscountAmount(baseSubtotal, item.descuento);
  const subtotalAfterDiscount = baseSubtotal - discountAmount;
  return roundToPrecision(subtotalAfterDiscount);
};

/**
 * Calculates IVA (tax) amount
 * Formula: subtotal_after_discount × (iva / 100)
 * @pure
 */
export const calculateIvaAmount = (item: PriceItem): number => {
  const subtotalAfterDiscount = calculateSubtotalAfterDiscount(item);
  const ivaDecimal = percentageToDecimal(item.iva);
  const ivaAmount = subtotalAfterDiscount * ivaDecimal;
  return roundToPrecision(ivaAmount);
};

/**
 * Calculates total for a single item (subtotal + IVA)
 * Formula: subtotal_after_discount + iva_amount
 * @pure
 */
export const calculateItemTotal = (item: PriceItem): number => {
  const subtotalAfterDiscount = calculateSubtotalAfterDiscount(item);
  const ivaAmount = calculateIvaAmount(item);
  const total = subtotalAfterDiscount + ivaAmount;
  return roundToPrecision(total);
};

/**
 * Calculates totals for multiple items
 * @pure
 */
export const calculateItemsTotals = (
  items: readonly PriceItem[]
): Pick<PriceTotals, 'subtotal' | 'iva' | 'total'> => {
  const subtotal = items.reduce(
    (acc, item) => acc + calculateSubtotalAfterDiscount(item),
    0
  );
  
  const iva = items.reduce(
    (acc, item) => acc + calculateIvaAmount(item),
    0
  );
  
  const total = subtotal + iva;
  
  return {
    subtotal: roundToPrecision(subtotal),
    iva: roundToPrecision(iva),
    total: roundToPrecision(total),
  };
};

/**
 * Calculates final totals including shipping
 * @pure
 */
export const calculateFinalTotals = (
  items: readonly PriceItem[],
  shippingCost: number,
  revisionValue: number = 0
): PriceTotals => {
  const itemsTotals = calculateItemsTotals(items);
  
  const finalTotal = itemsTotals.total + shippingCost;
  
  return {
    subtotal: itemsTotals.subtotal,
    iva: itemsTotals.iva,
    total: roundToPrecision(finalTotal),
    valor_revision: revisionValue,
    precio_envio: shippingCost,
  };
};

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Formats number as Colombian currency
 * @pure
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats number with thousand separators
 * @pure
 */
export const formatNumberWithCommas = (value: number): string => {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString('es-CO');
};

/**
 * Formats percentage for display (without % symbol)
 * @pure
 */
export const formatPercentageValue = (value: number): string => {
  if (value === 0) return '';
  // Remove trailing zeros and decimal point if not needed
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parses currency string to number
 * Removes all non-numeric characters except decimal point and minus sign
 * @pure
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  
  if (!cleaned || cleaned === '-' || cleaned === '.') {
    return 0;
  }
  
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Parses percentage string to number
 * Removes all non-numeric characters except decimal point and minus sign
 * @pure
 */
export const parsePercentage = (value: string): number => {
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  
  if (!cleaned || cleaned === '-' || cleaned === '.') {
    return 0;
  }
  
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a percentage is within valid range
 * @pure
 */
export const isValidPercentage = (value: number): boolean => {
  return Number.isFinite(value) && value >= 0 && value <= 100;
};

/**
 * Validates if a price is valid
 * @pure
 */
export const isValidPrice = (value: number): boolean => {
  return Number.isFinite(value) && value >= 0;
};

/**
 * Validates if a quantity is valid
 * @pure
 */
export const isValidQuantity = (value: number): boolean => {
  return Number.isFinite(value) && value > 0 && Number.isInteger(value);
};
