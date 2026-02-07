import {
  SHADE_FEATURE_CACHE_TTL_MS,
  SHADE_FEATURE_MIN_ZOOM,
  TERRAIN_SOURCE
} from '../constants.mjs';
import { formatClock } from '../utils/format.mjs';

export class ShadeController {
  constructor({ map, apiClient, dom, onStatus }) {
    this.map = map;
    this.apiClient = apiClient;
    this.dom = dom;
    this.onStatus = onStatus;

    this.layer = null;
    this.currentDate = new Date();
    this.playTimer = null;
    this.cursorListenerAttached = false;

    this.featureCache = new Map();
    this.lastFeatures = [];
    this.pending = null;
    this.requestCounter = 0;

    this.viewportTimer = null;

    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.updateHoursAtCursor = this.updateHoursAtCursor.bind(this);
  }

  async init(runtimeConfig) {
    const apiKey = String(runtimeConfig?.shadeMapApiKey || '').trim();
    if (!apiKey || typeof L.shadeMap !== 'function') {
      throw new Error('ShadeMap API key or library missing.');
    }

    this.layer = L.shadeMap({
      apiKey,
      date: this.currentDate,
      color: '#01112f',
      opacity: 0.72,
      terrainSource: TERRAIN_SOURCE,
      getFeatures: async () => await this.getFeaturesForViewport()
    }).addTo(this.map);

    this.layer.on('tileloaded', (loadedTiles, totalTiles) => {
      if (!Number.isFinite(totalTiles) || totalTiles <= 0) {
        this.dom.loaderEl.textContent = 'Idle';
        return;
      }

      const pct = Math.round((loadedTiles / totalTiles) * 100);
      this.dom.loaderEl.textContent = `${pct}%`;
    });

    this.map.on('moveend zoomend', this.handleViewportChange);
    this.syncClockLabel();
  }

  setDate(date, reapplyExposure = true) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return;
    }

    this.currentDate = date;
    this.syncClockLabel();

    if (!this.layer) {
      return;
    }

    this.layer.setDate(this.currentDate);
    if (reapplyExposure && this.dom.exposureCheckbox.checked) {
      this.applyExposureMode(true);
    }
  }

  shiftHours(deltaHours) {
    this.setDate(new Date(this.currentDate.getTime() + (deltaHours * 3600 * 1000)));
  }

  startPlayback() {
    this.stopPlayback();
    this.playTimer = setInterval(() => {
      this.setDate(new Date(this.currentDate.getTime() + 60 * 1000));
    }, 100);
  }

  stopPlayback() {
    clearInterval(this.playTimer);
    this.playTimer = null;
  }

  applyExposureMode(keepExisting = false) {
    this.stopPlayback();
    if (!this.layer) {
      this.dom.exposureCheckbox.checked = false;
      return;
    }

    if (!this.dom.exposureCheckbox.checked) {
      this.layer.setSunExposure(false);
      this.detachCursorHours();
      this.map.getContainer().style.cursor = '';
      this.dom.exposureGradientContainer.classList.add('hidden');
      this.dom.hoursEl.textContent = '-';
      this.setTimeControlsEnabled(true);
      return;
    }

    const center = this.map.getCenter();
    const times = SunCalc.getTimes(this.currentDate, center.lat, center.lng);

    this.layer.setSunExposure(true, {
      startDate: times.sunrise,
      endDate: times.sunset
    });

    this.attachCursorHours();
    this.map.getContainer().style.cursor = 'crosshair';
    this.dom.exposureGradientContainer.classList.remove('hidden');
    this.setTimeControlsEnabled(false);
    this.renderExposureScale(times.sunrise, times.sunset);

    if (!keepExisting) {
      this.onStatus?.('Full-day sun exposure mode enabled. Move cursor on map to inspect sunlight hours.');
    }
  }

  setTimeControlsEnabled(enabled) {
    this.dom.incrementBtn.disabled = !enabled;
    this.dom.decrementBtn.disabled = !enabled;
    this.dom.playBtn.disabled = !enabled;
    this.dom.stopBtn.disabled = !enabled;
  }

  syncClockLabel() {
    this.dom.currentTimeEl.textContent = formatClock(this.currentDate);
  }

  renderExposureScale(sunrise, sunset) {
    const totalHours = Math.max(0, (sunset - sunrise) / 1000 / 3600);
    const wholeHours = Math.floor(totalHours);
    const partial = totalHours - wholeHours;
    const nodes = [];

    for (let i = 0; i < wholeHours; i += 1) {
      nodes.push(`<div>${i + 1}</div>`);
    }

    if (partial > 0.01) {
      nodes.push(`<div style="flex:${partial.toFixed(2)}"></div>`);
    }

    this.dom.exposureGradient.innerHTML = nodes.join('');
  }

  attachCursorHours() {
    if (this.cursorListenerAttached) {
      return;
    }

    document.addEventListener('mousemove', this.updateHoursAtCursor);
    this.cursorListenerAttached = true;
  }

  detachCursorHours() {
    if (!this.cursorListenerAttached) {
      return;
    }

    document.removeEventListener('mousemove', this.updateHoursAtCursor);
    this.cursorListenerAttached = false;
  }

  updateHoursAtCursor(event) {
    if (!this.layer || !this.dom.exposureCheckbox.checked) {
      return;
    }

    const hours = this.layer.getHoursOfSun(event.clientX, event.clientY);
    if (Number.isFinite(hours)) {
      this.dom.hoursEl.textContent = hours.toFixed(1);
    }
  }

  handleViewportChange() {
    if (!this.layer) {
      return;
    }

    clearTimeout(this.viewportTimer);
    this.viewportTimer = setTimeout(() => {
      this.layer.setDate(this.currentDate);
      if (this.dom.exposureCheckbox.checked) {
        this.applyExposureMode(true);
      }
    }, 120);
  }

  async getFeaturesForViewport() {
    const zoom = this.map.getZoom();
    if (zoom < SHADE_FEATURE_MIN_ZOOM) {
      this.dom.loaderEl.textContent = 'Zoom in';
      return this.lastFeatures;
    }

    const bounds = this.map.getBounds().pad(0.33);
    const spanLat = bounds.getNorth() - bounds.getSouth();
    const spanLng = bounds.getEast() - bounds.getWest();
    if (spanLat > 0.24 || spanLng > 0.24) {
      this.dom.loaderEl.textContent = 'Zoom in';
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
          this.onStatus?.('Shadow features reload delayed. Retrying on next map move.');
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
