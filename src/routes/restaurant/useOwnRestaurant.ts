import { useStore } from '../../store/StoreProvider';
import type { Restaurant } from '../../types';

/** The demo owner's restaurant. Throws only if the seed is broken. */
export function useOwnRestaurant(): Restaurant {
  const { ownRestaurant } = useStore();
  if (!ownRestaurant) throw new Error('The demo owner has no restaurant in the seed');
  return ownRestaurant;
}
