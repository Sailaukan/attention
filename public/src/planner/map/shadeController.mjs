import {
  SHADE_FEATURE_CACHE_TTL_MS,
  SHADE_FEATURE_MIN_ZOOM,
  TERRAIN_SOURCE
} from '../config/constants.mjs';

export class ShadeController {
  constructor({ map, apiClient, onStatus }) {
    this.map = map;
    this.apiClient = apiClient;
    this.onStatus = onStatus;

    this.layer = null;
    this.currentDate = new Date();

    this.featureCache = new Map();
    this.lastFeatures = [];
    this.pending = null;
    this.requestCounter = 0;
    this.viewportTimer = null;

    this.handleViewportChange = this.handleViewportChange.bind(this);
  }

  async init(runtimeConfig, date = new Date()) {
    const apiKey = String(runtimeConfig?.shadeMapApiKey || '').trim();
    if (!apiKey) {
      this.onStatus?.('Map shadows are disabled. Set SHADEMAP_API_KEY to enable them.');
      return false;
    }

    if (typeof L.shadeMap !== 'function') {
      this.onStatus?.('Map shadows are disabled. Shadow simulator script failed to load.');
      return false;
    }

    this.currentDate = (date instanceof Date && !Number.isNaN(date.getTime())) ? date : new Date();
    this.layer = L.shadeMap({
      apiKey,
      date: this.currentDate,
      color: '#01112f',
      opacity: 0.72,
      terrainSource: TERRAIN_SOURCE,
      getFeatures: async () => await this.getFeaturesForViewport()
    }).addTo(this.map);

    this.map.on('moveend zoomend', this.handleViewportChange);
    return true;
  }

  setDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return;
    }

    this.currentDate = date;
    this.layer?.setDate(this.currentDate);
  }

  handleViewportChange() {
    if (!this.layer) {
      return;
    }

    clearTimeout(this.viewportTimer);
    this.viewportTimer = setTimeout(() => {
      this.layer?.setDate(this.currentDate);
    }, 120);
  }

  async getFeaturesForViewport() {
    const zoom = this.map.getZoom();
    if (zoom < SHADE_FEATURE_MIN_ZOOM) {
      return this.lastFeatures;
    }

    const bounds = this.map.getBounds().pad(0.33);
    const spanLat = bounds.getNorth() - bounds.getSouth();
    const spanLng = bounds.getEast() - bounds.getWest();
    if (spanLat > 0.24 || spanLng > 0.24) {
      return this.lastFeatures;
    }

    const key = this.boundsKey(bounds);
    const cacheItem = this.featureCache.get(key);
    if (cacheItem && (Date.now() - cacheItem.ts) < SHADE_FEATURE_CACHE_TTL_MS) {
      return cacheItem.features;
    }

    if (this.pending?.key === key) {
      return this.pending.promise;
    }

    if (this.pending?.controller) {
      this.pending.controller.abort();
    }

    const controller = new AbortController();
    const requestId = ++this.requestCounter;

    const promise = this.apiClient.fetchBuildingFeatures({
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
      signal: controller.signal
    })
      .then((features) => {
        if (requestId !== this.requestCounter) {
          return this.lastFeatures;
        }

        if (features.length) {
          this.lastFeatures = features;
        }

        this.featureCache.set(key, { ts: Date.now(), features: this.lastFeatures });
        this.trimCache();
        return this.lastFeatures;
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          this.onStatus?.('Shadow data reload delayed. Retrying on next map move.');
        }
        return this.lastFeatures;
      })
      .finally(() => {
        if (this.pending?.id === requestId) {
          this.pending = null;
        }
      });

    this.pending = {
      id: requestId,
      key,
      controller,
      promise
    };

    return promise;
  }

  boundsKey(bounds) {
    return [
      bounds.getSouth().toFixed(4),
      bounds.getWest().toFixed(4),
      bounds.getNorth().toFixed(4),
      bounds.getEast().toFixed(4)
    ].join(',');
  }

  trimCache() {
    if (this.featureCache.size < 12) {
      return;
    }

    const keys = [...this.featureCache.keys()];
    for (let i = 0; i < keys.length - 8; i += 1) {
      this.featureCache.delete(keys[i]);
    }
  }
}
