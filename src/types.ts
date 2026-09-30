import type { ImageSourcePropType } from 'react-native';

export type Rarity = 'Classic' | 'Rare' | 'Elite' | 'Legend';

export type Watch = {
  id: string;
  name: string;
  rarity: Rarity;
  image: ImageSourcePropType;
  value: number;
  description: string;
};

/** sRGB hex colours applied to the shared box model's materials. */
export type BoxPalette = {
  body: string;
  accent: string;
  wordmark: string;
  lining: string;
  /** UI glow used around the box and during the reveal. */
  glow: string;
};

export type BoxOdds = {
  watchId: string;
  /** Probability in percent; a box's odds sum to 100. */
  chance: number;
};

export type BoxDefinition = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  palette: BoxPalette;
  odds: BoxOdds[];
};

/** A watch the user owns. `uid` is unique per pull, so duplicates are allowed. */
export type OwnedWatch = {
  uid: string;
  watchId: string;
  boxId: string;
  acquiredAt: number;
};
