import {
  getRuntimeConfig,
  geocodeFirst,
  optimizeRoute,
  reverseGeocode,
  fetchBuildingFeatures
} from './api/client.mjs';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './constants.mjs';
import { RouteRenderer } from './map/routeRenderer.mjs';
import { ShadeController } from './map/shadeController.mjs';
import { mountAppShell } from './ui/appShell.mjs';
import { getDomRefs } from './ui/dom.mjs';
import { createUiController } from './ui/controller.mjs';

const appRoot = document.getElementById('app');

if (!appRoot) {
  throw new Error('Missing #app root container.');
}

mountAppShell(appRoot);
requestAnimationFrame(() => startWhenDomReady());

function startWhenDomReady(attempt = 0) {
  const dom = getDomRefs();
  if (!dom.form || !document.getElementById('map')) {
    if (attempt < 5) {
      requestAnimationFrame(() => startWhenDomReady(attempt + 1));
      return;
    }

    throw new Error('App shell did not mount all required elements.');
  }

  startApp(dom);
}

function startApp(dom) {
  const ui = createUiController(dom);

  const map = L.map('map', { zoomControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const routeRenderer = new RouteRenderer(map);
  const shadeController = new ShadeController({
    map,
    apiClient: { fetchBuildingFeatures },
    dom,
    onStatus: (message) => ui.setStatus(message)
  });

  const state = {
    pickMode: null,
    fromSelection: null,
    toSelection: null,
    runtimeConfigLoaded: false
  };

  wireEvents();
  void bootstrap();

  async function bootstrap() {
    try {
      const runtimeConfig = await getRuntimeConfig();
      state.runtimeConfigLoaded = true;

      await shadeController.init(runtimeConfig);
      ui.setStatus('ShadeMap connected. Enter addresses or use map pick mode.');
    } catch (error) {
      ui.setStatus(error.message, true);
    }
  }

  function wireEvents() {
    dom.form.addEventListener('submit', onRouteSubmit);

    dom.swapBtn.addEventListener('click', onSwapLocations);
    dom.clearBtn.addEventListener('click', clearAllSelections);
    dom.pickFromBtn.addEventListener('click', () => togglePickMode('from'));
    dom.pickToBtn.addEventListener('click', () => togglePickMode('to'));

    dom.fromInput.addEventListener('input', () => {
      state.fromSelection = null;
      syncDraftMarkers();
    });

    dom.toInput.addEventListener('input', () => {
      state.toSelection = null;
      syncDraftMarkers();
    });

    dom.incrementBtn.addEventListener('click', () => shadeController.shiftHours(1));
    dom.decrementBtn.addEventListener('click', () => shadeController.shiftHours(-1));
    dom.playBtn.addEventListener('click', () => shadeController.startPlayback());
    dom.stopBtn.addEventListener('click', () => shadeController.stopPlayback());
    dom.exposureCheckbox.addEventListener('change', () => shadeController.applyExposureMode());

    map.on('click', onMapClickForLocation);
  }

  async function onRouteSubmit(event) {
    event.preventDefault();

    const fromText = dom.fromInput.value.trim();
    const toText = dom.toInput.value.trim();

    if (!fromText || !toText) {
      ui.setStatus('Both A and B locations are required.', true);
      return;
    }

    try {
      ui.setLoading(true);

      const from = await resolveLocation('from', fromText);
      const to = await resolveLocation('to', toText);

      if (!from || !to) {
        throw new Error('Unable to resolve one or both locations. Try another query or map pick.');
      }

      ui.setStatus('Calculating shadow-optimized route...');
      const result = await optimizeRoute(from, to, dom.autoPodInput.checked);

      routeRenderer.renderRoute(result, from, to);
      ui.updateSummary(result.summary);
      ui.updatePod(result.podDispatch, result.bestRoute.shadowEnd);
      ui.updateAlternatives(result.alternatives);

      if (result.generatedAt) {
        shadeController.setDate(new Date(result.generatedAt), false);
      }

      const warning = Array.isArray(result.warnings) && result.warnings.length ? ` ${result.warnings[0]}` : '';
      ui.setStatus(`Route ready. ${result.summary.shadeRatio}% in shade at current time.${warning}`);
    } catch (error) {
      ui.setStatus(error.message || 'Route generation failed.', true);
    } finally {
      ui.setLoading(false);
    }
  }

  function onSwapLocations() {
    const oldFromText = dom.fromInput.value;
    dom.fromInput.value = dom.toInput.value;
    dom.toInput.value = oldFromText;

    const oldFromSelection = state.fromSelection;
    state.fromSelection = state.toSelection;
    state.toSelection = oldFromSelection;

    syncDraftMarkers();
  }

  function clearAllSelections() {
    dom.fromInput.value = '';
    dom.toInput.value = '';
    state.fromSelection = null;
    state.toSelection = null;
    setPickMode(null);
    routeRenderer.clearAll();
    routeRenderer.clearPickMarkers();
    ui.resetMetrics();
    ui.setStatus('Cleared. Enter addresses or pick points directly on the map.');
  }

  function togglePickMode(mode) {
    setPickMode(state.pickMode === mode ? null : mode);
  }

  function setPickMode(mode) {
    state.pickMode = mode;
    ui.setPickMode(mode);
  }

  async function onMapClickForLocation(event) {
    if (!state.pickMode) {
      return;
    }

    const target = state.pickMode;
    const lat = Number(event.latlng.lat.toFixed(6));
    const lng = Number(event.latlng.lng.toFixed(6));

    ui.setStatus(`Resolving ${target === 'from' ? 'Start (A)' : 'Destination (B)'} location...`);

    try {
      const place = await reverseGeocode(lat, lng);
      applyPickedLocation(target, place);

      if (target === 'from' && !state.toSelection) {
        setPickMode('to');
      } else {
        setPickMode(null);
      }
    } catch (_error) {
      const fallback = {
        label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng
      };
      applyPickedLocation(target, fallback);
      setPickMode(null);
    }
  }

  function applyPickedLocation(kind, place) {
    if (kind === 'from') {
      state.fromSelection = place;
      dom.fromInput.value = place.label;
    } else {
      state.toSelection = place;
      dom.toInput.value = place.label;
    }

    syncDraftMarkers();

    if (state.fromSelection && state.toSelection) {
      const bounds = L.latLngBounds(
        [state.fromSelection.lat, state.fromSelection.lng],
        [state.toSelection.lat, state.toSelection.lng]
      );
      map.fitBounds(bounds.pad(0.2), { animate: true, duration: 0.4 });
    }

    ui.setStatus(`${kind === 'from' ? 'Start (A)' : 'Destination (B)'} set from map.`);
  }

  function syncDraftMarkers() {
    routeRenderer.clearPickMarkers();

    if (state.fromSelection) {
      routeRenderer.setDraftPoint('from', state.fromSelection, state.fromSelection.label);
    }

    if (state.toSelection) {
      routeRenderer.setDraftPoint('to', state.toSelection, state.toSelection.label);
    }
  }

  async function resolveLocation(kind, typedValue) {
    const selection = kind === 'from' ? state.fromSelection : state.toSelection;

    if (selection && selection.label === typedValue) {
      return selection;
    }

    const geocoded = await geocodeFirst(typedValue);
    if (!geocoded) {
      return null;
    }

    if (kind === 'from') {
      state.fromSelection = geocoded;
    } else {
      state.toSelection = geocoded;
    }

    syncDraftMarkers();
    return geocoded;
  }
}
