import type { User, Zone } from '../types';

export const ZONE_UCB: Zone = {
  id: 'zone-ucb',
  name: 'UCB Cochabamba',
  city: 'Cochabamba',
  lat: -17.3763,
  lng: -66.1463,
};

/** The buyer you play in the demo: an out-of-town UCB student. */
export const DEMO_BUYER_ID = 'usr-buyer';
/** The owner you play in the demo: runs Sabor Valluno. */
export const DEMO_OWNER_ID = 'usr-owner-sv';

export const USERS: User[] = [
  {
    id: DEMO_BUYER_ID,
    role: 'buyer',
    fullName: 'Valeria Mamani',
    email: 'valeria.mamani@ucb.edu.bo',
    zoneId: ZONE_UCB.id,
    isOutOfTown: true,
  },
  // Other students, so restaurants have orders that aren't yours.
  { id: 'usr-b2', role: 'buyer', fullName: 'Diego Choque', email: 'diego.choque@ucb.edu.bo', zoneId: ZONE_UCB.id, isOutOfTown: false },
  { id: 'usr-b3', role: 'buyer', fullName: 'Lucía Fernández', email: 'lucia.fernandez@ucb.edu.bo', zoneId: ZONE_UCB.id, isOutOfTown: true },
  { id: 'usr-b4', role: 'buyer', fullName: 'Andrés Rocha', email: 'andres.rocha@ucb.edu.bo', zoneId: ZONE_UCB.id, isOutOfTown: false },
  {
    id: DEMO_OWNER_ID,
    role: 'restaurant_owner',
    fullName: 'Marcelo Vargas',
    email: 'marcelo@saborvalluno.bo',
    zoneId: ZONE_UCB.id,
    isOutOfTown: false,
  },
  { id: 'usr-owner-le', role: 'restaurant_owner', fullName: 'Carmen Terrazas', email: 'carmen@laespiga.bo', zoneId: ZONE_UCB.id, isOutOfTown: false },
  { id: 'usr-owner-rc', role: 'restaurant_owner', fullName: 'Jorge Salazar', email: 'jorge@rinconcochala.bo', zoneId: ZONE_UCB.id, isOutOfTown: false },
  { id: 'usr-owner-ct', role: 'restaurant_owner', fullName: 'Paola Antezana', email: 'paola@cafetunari.bo', zoneId: ZONE_UCB.id, isOutOfTown: false },
  { id: 'usr-owner-pdr', role: 'restaurant_owner', fullName: 'Rosa Quiroga', email: 'dona.rosa@pollosdonarosa.bo', zoneId: ZONE_UCB.id, isOutOfTown: false },
];
