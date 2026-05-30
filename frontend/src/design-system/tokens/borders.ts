/**
 * Tokens de bordures.
 */

export const borders = {
  width: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
} as const;

export type BorderToken = typeof borders;
