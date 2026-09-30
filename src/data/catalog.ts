import type { BoxDefinition, Watch } from '../types';

export const WATCHES: Record<string, Watch> = {
  casio: {
    id: 'casio',
    name: 'Casio Dusk',
    rarity: 'Classic',
    image: require('../../assets/watches/casio.png'),
    value: 120,
    description: 'A clean everyday reference with a polished steel case.',
  },
  gmt: {
    id: 'gmt',
    name: 'GMT Pulse',
    rarity: 'Rare',
    image: require('../../assets/watches/gmt.png'),
    value: 540,
    description: 'Dual-time styling with a confident bezel and luminous dial.',
  },
  perpetual: {
    id: 'perpetual',
    name: 'Perpetual S',
    rarity: 'Elite',
    image: require('../../assets/watches/perpetual.png'),
    value: 920,
    description: 'A dress watch with an icy blue dial and a moonlit steel finish.',
  },
  skyDweller: {
    id: 'skyDweller',
    name: 'Sky-Dweller',
    rarity: 'Legend',
    image: require('../../assets/watches/sky-dweller.png'),
    value: 1650,
    description: 'An annual-calendar travel watch built for long-haul collectors.',
  },
};

export const BOXES: BoxDefinition[] = [
  {
    id: 'frost',
    name: 'Frost',
    tagline: 'The starter vault. Reliable pulls with a shot at steel.',
    price: 150,
    palette: {
      body: '#45566a',
      accent: '#9fe3f2',
      wordmark: '#c9d6e3',
      lining: '#a3673f',
      glow: '#7dd3fc',
    },
    odds: [
      { watchId: 'casio', chance: 70 },
      { watchId: 'gmt', chance: 25 },
      { watchId: 'perpetual', chance: 5 },
    ],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Balanced odds with a real chance at the Sky-Dweller.',
    price: 380,
    palette: {
      body: '#1c1f2b',
      accent: '#a78bfa',
      wordmark: '#8b93a7',
      lining: '#6d4aa8',
      glow: '#a78bfa',
    },
    odds: [
      { watchId: 'casio', chance: 30 },
      { watchId: 'gmt', chance: 40 },
      { watchId: 'perpetual', chance: 22 },
      { watchId: 'skyDweller', chance: 8 },
    ],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    tagline: 'No entry-level pieces. Elite and Legend weighted.',
    price: 820,
    palette: {
      body: '#5c1d25',
      accent: '#f4c262',
      wordmark: '#e9c77f',
      lining: '#d9a441',
      glow: '#fbbf24',
    },
    odds: [
      { watchId: 'gmt', chance: 35 },
      { watchId: 'perpetual', chance: 40 },
      { watchId: 'skyDweller', chance: 25 },
    ],
  },
];

export const findBox = (id: string) => BOXES.find((box) => box.id === id);

export const currency = (value: number) => `$${value.toLocaleString('en-US')}`;
