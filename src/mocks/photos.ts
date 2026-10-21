import type { PhotoKey } from '../types';

export interface PhotoInfo {
  /** Path under public/. Drop a real photo there with this name and it is used automatically. */
  src: string;
  /** Shown until the real photo exists (see components/Photo). */
  emoji: string;
  label: string;
}

export const PHOTOS: Record<PhotoKey, PhotoInfo> = {
  silpancho: { src: '/img/silpancho.jpg', emoji: '🍳', label: 'Silpancho' },
  pique: { src: '/img/pique.jpg', emoji: '🍖', label: 'Pique macho' },
  'sopa-de-mani': { src: '/img/sopa-de-mani.jpg', emoji: '🥣', label: 'Sopa de maní' },
  pan: { src: '/img/pan.jpg', emoji: '🥖', label: 'Pan y empanadas' },
  chicharron: { src: '/img/chicharron.jpg', emoji: '🥩', label: 'Chicharrón' },
  pollo: { src: '/img/pollo.jpg', emoji: '🍗', label: 'Pollo' },
  saltenas: { src: '/img/saltenas.jpg', emoji: '🥟', label: 'Salteñas' },
  masitas: { src: '/img/masitas.jpg', emoji: '🥐', label: 'Masitas de café' },
  torta: { src: '/img/torta.jpg', emoji: '🍰', label: 'Torta' },
  almuerzo: { src: '/img/almuerzo.jpg', emoji: '🍽️', label: 'Almuerzo del día' },
};
