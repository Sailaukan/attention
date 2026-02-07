export const DEFAULT_CENTER = [25.2048, 55.2708];
export const DEFAULT_ZOOM = 14;

export const SHADE_FEATURE_CACHE_TTL_MS = 90 * 1000;
export const SHADE_FEATURE_MIN_ZOOM = 14;

export const TERRAIN_SOURCE = {
  maxZoom: 15,
  tileSize: 256,
  getSourceUrl: ({ x, y, z }) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
  getElevation: ({ r, g, b }) => (r * 256 + g + (b / 256)) - 32768
};
