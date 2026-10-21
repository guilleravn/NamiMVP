import { ZONE_UCB } from '../../mocks/people';
import { useStore } from '../../store/StoreProvider';
import type { Zone } from '../../types';

/** Where the current buyer picks up food (UCB Cochabamba in the demo). */
export function useBuyerZone(): Zone {
  const { db, currentUser } = useStore();
  return db.zones.find((z) => z.id === currentUser?.zoneId) ?? ZONE_UCB;
}
