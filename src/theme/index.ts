import type { Rarity } from '../types';

export const colors = {
  background: '#07090d',
  surface: '#10141b',
  surfaceRaised: '#171c25',
  border: '#232a36',
  text: '#f4f6fa',
  textMuted: '#9aa4b5',
  textFaint: '#5d6778',
  primary: '#e8ecf3',
  onPrimary: '#07090d',
  danger: '#f87171',
};

export const rarityColors: Record<Rarity, string> = {
  Classic: '#9aa4b5',
  Rare: '#38bdf8',
  Elite: '#c084fc',
  Legend: '#fbbf24',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
};
