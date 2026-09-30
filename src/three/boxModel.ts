import type { Float3, Float4 } from 'react-native-filament';

/** Values from assets/box/MODEL.md. */
export const BOX_MODEL = require('../../assets/box/designer-box-2-v1-icy.glb');

export const PART = {
  base: 'Shell_Base',
  cushion: 'Shell_Fitted_Cushion',
  lid: 'Shell_Lid',
  seam: 'Shell_Seam',
  wordmark: 'Shell_Wordmark',
} as const;

/** Primitive order within each glTF mesh; each primitive has its own material. */
export const PRIMITIVE = {
  baseBody: 0, // Shell_Base → ShellRole_Body_Matte
  lidBody: 0, // Shell_Lid → ShellRole_Body_Matte
  lidInner: 1, // Shell_Lid → ShellRole_Cavity_Inner
  seamAccent: 0, // Shell_Seam → ShellRole_SeamAccent_Accent
  seamLining: 1, // Shell_Seam → ShellRole_Cavity_Lining
  wordmark: 0, // Shell_Wordmark → ShellRole_Body_Wordmark
} as const;

export const HINGE_PIVOT: Float3 = [0, 0.914876, 0.359181];
export const HINGE_AXIS: Float3 = [1, 0, 0];
export const OPEN_ANGLE = (115 * Math.PI) / 180;

/** Closed box is Y = 0…1.1166; fully open reaches Y ≈ 1.8654. */
export const CLOSED_CENTER_Y = 0.56;
export const OPEN_CENTER_Y = 0.93;

/** Converts an sRGB hex colour to the linear RGBA glTF expects for baseColorFactor. */
export const hexToLinear = (hex: string): Float4 => {
  const digits = hex.replace('#', '');
  const channel = (offset: number) => Math.pow(parseInt(digits.slice(offset, offset + 2), 16) / 255, 2.2);
  return [channel(0), channel(2), channel(4), 1];
};
