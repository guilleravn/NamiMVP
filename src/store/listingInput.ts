import type { ListingFormat, PhotoKey } from '../types';

/** What a restaurant fills in to post (or edit) leftovers. Times are "HH:MM" on the posting day. */
export interface ListingInput {
  format: ListingFormat;
  title: string;
  description: string;
  photo: PhotoKey;
  portionsTotal: number;
  preparedAt: string;
  regularPrice: number;
  price: number;
  pickupStart: string;
  pickupEnd: string;
}

export type ListingField = keyof ListingInput;
export type ListingErrors = Partial<Record<ListingField, string>>;

/** Ñami price must be 30–70% below the regular price. */
export const MIN_DISCOUNT = 0.3;
export const MAX_DISCOUNT = 0.7;
const EPSILON = 1e-9;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Field errors in Spanish, ready to show under each input. Empty object = valid. */
export function validateListingInput({ input, nowHHMM }: { input: ListingInput; nowHHMM?: string }): ListingErrors {
  const errors: ListingErrors = {};

  if (input.title.trim().length === 0) {
    errors.title = input.format === 'dish' ? 'Escribe el nombre del plato.' : 'Cuenta qué puede traer la bolsa.';
  }

  if (!Number.isInteger(input.portionsTotal) || input.portionsTotal < 1) {
    errors.portionsTotal = 'Publica al menos 1 porción.';
  }

  if (!Number.isFinite(input.regularPrice) || input.regularPrice <= 0) {
    errors.regularPrice = 'Ingresa el precio normal.';
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = 'Ingresa el precio en Ñami.';
  } else if (errors.regularPrice === undefined) {
    const discount = (input.regularPrice - input.price) / input.regularPrice;
    if (discount < MIN_DISCOUNT - EPSILON || discount > MAX_DISCOUNT + EPSILON) {
      errors.price = 'Debe tener entre 30% y 70% de descuento sobre el precio normal.';
    }
  }

  if (!HHMM.test(input.preparedAt)) errors.preparedAt = 'Ingresa la hora en que se preparó.';
  if (!HHMM.test(input.pickupStart)) errors.pickupStart = 'Ingresa desde qué hora pueden retirar.';
  if (!HHMM.test(input.pickupEnd)) errors.pickupEnd = 'Ingresa hasta qué hora pueden retirar.';

  if (errors.pickupStart === undefined && errors.pickupEnd === undefined) {
    if (input.pickupEnd <= input.pickupStart) {
      errors.pickupEnd = 'El fin del retiro debe ser después del inicio.';
    } else if (nowHHMM !== undefined && input.pickupEnd <= nowHHMM) {
      errors.pickupEnd = 'Esa hora de retiro ya pasó.';
    }
  }
  if (errors.preparedAt === undefined && errors.pickupStart === undefined && input.preparedAt > input.pickupStart) {
    errors.preparedAt = 'Debe estar preparado antes de que empiece el retiro.';
  }

  return errors;
}

export function hasErrors(errors: ListingErrors): boolean {
  return Object.keys(errors).length > 0;
}
