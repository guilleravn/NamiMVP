import { addDays, atTime } from '../lib/time';
import type { Restaurant } from '../types';
import { DEMO_OWNER_ID, ZONE_UCB } from './people';

export const RESTAURANT_IDS = {
  saborValluno: 'rst-sabor-valluno',
  laEspiga: 'rst-la-espiga',
  rinconCochala: 'rst-rincon-cochala',
  cafeTunari: 'rst-cafe-tunari',
  pollosDonaRosa: 'rst-pollos-dona-rosa',
};

/** Fictional restaurants within ~1 km of UCB Cochabamba. */
export function buildRestaurants(today: Date): Restaurant[] {
  return [
    {
      id: RESTAURANT_IDS.saborValluno,
      ownerId: DEMO_OWNER_ID,
      zoneId: ZONE_UCB.id,
      name: 'Sabor Valluno',
      type: 'restaurant',
      address: 'Av. Oquendo 1340, casi Calle Jordán',
      lat: -17.3736,
      lng: -66.1463,
      rushHourEndsAt: '14:30',
      feePerDish: 2,
      feeFreeUntil: null,
      rating: { average: 4.8, count: 46 },
    },
    {
      // New on Ñami: no ratings yet, still inside its free first month.
      id: RESTAURANT_IDS.laEspiga,
      ownerId: 'usr-owner-le',
      zoneId: ZONE_UCB.id,
      name: 'La Espiga',
      type: 'bakery',
      address: 'Calle Tupuraya 455',
      lat: -17.3763,
      lng: -66.1421,
      rushHourEndsAt: '13:00',
      feePerDish: 2,
      feeFreeUntil: atTime({ day: addDays(today, 20), hhmm: '00:00' }),
      rating: null,
    },
    {
      id: RESTAURANT_IDS.rinconCochala,
      ownerId: 'usr-owner-rc',
      zoneId: ZONE_UCB.id,
      name: 'El Rincón Cochala',
      type: 'restaurant',
      address: 'Av. Ballivián 820',
      lat: -17.3817,
      lng: -66.1463,
      rushHourEndsAt: '14:30',
      feePerDish: 2,
      feeFreeUntil: null,
      rating: { average: 4.6, count: 31 },
    },
    {
      id: RESTAURANT_IDS.cafeTunari,
      ownerId: 'usr-owner-ct',
      zoneId: ZONE_UCB.id,
      name: 'Café Tunari',
      type: 'cafe',
      address: 'Calle España 210',
      lat: -17.3763,
      lng: -66.1482,
      rushHourEndsAt: '16:00',
      feePerDish: 2,
      feeFreeUntil: null,
      rating: { average: 4.7, count: 12 },
    },
    {
      id: RESTAURANT_IDS.pollosDonaRosa,
      ownerId: 'usr-owner-pdr',
      zoneId: ZONE_UCB.id,
      name: 'Pollos Doña Rosa',
      type: 'fast_food',
      address: 'Av. Aniceto Arce 1150',
      lat: -17.3713,
      lng: -66.1403,
      rushHourEndsAt: '14:30',
      feePerDish: 2,
      feeFreeUntil: null,
      rating: { average: 4.3, count: 58 },
    },
  ];
}
