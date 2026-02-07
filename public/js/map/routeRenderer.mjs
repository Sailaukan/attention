import { escapeHtml, formatMeters } from '../utils/format.mjs';

export class RouteRenderer {
  constructor(map) {
    this.map = map;
    this.map.createPane('routePane');
    this.map.getPane('routePane').style.zIndex = '640';

    this.routeLayer = L.layerGroup().addTo(map);
    this.markerLayer = L.layerGroup().addTo(map);
    this.helperLayer = L.layerGroup().addTo(map);
    this.pickLayer = L.layerGroup().addTo(map);

    this.fromDraft = null;
    this.toDraft = null;

    this.startIcon = L.divIcon({
      className: 'start-marker',
      html: '<div style="background:#0f766e;color:#fff;border-radius:999px;padding:3px 8px;font:700 12px Manrope">A</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.endIcon = L.divIcon({
      className: 'end-marker',
      html: '<div style="background:#0ea5e9;color:#fff;border-radius:999px;padding:3px 8px;font:700 12px Manrope">B</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  clearAll() {
    this.routeLayer.clearLayers();
    this.markerLayer.clearLayers();
    this.helperLayer.clearLayers();
  }

  clearPickMarkers() {
    this.pickLayer.clearLayers();
    this.fromDraft = null;
    this.toDraft = null;
  }

  setDraftPoint(type, point, label) {
    if (type === 'from') {
      this.fromDraft = { point, label };
    }
    if (type === 'to') {
      this.toDraft = { point, label };
    }

    this.renderDraftMarkers();
  }

  renderDraftMarkers() {
    this.pickLayer.clearLayers();

    if (this.fromDraft && Number.isFinite(this.fromDraft.point.lat) && Number.isFinite(this.fromDraft.point.lng)) {
      L.marker([this.fromDraft.point.lat, this.fromDraft.point.lng], { icon: this.startIcon })
        .bindPopup(`<strong>Start (A)</strong><br>${escapeHtml(this.fromDraft.label)}`)
        .addTo(this.pickLayer);
    }

    if (this.toDraft && Number.isFinite(this.toDraft.point.lat) && Number.isFinite(this.toDraft.point.lng)) {
      L.marker([this.toDraft.point.lat, this.toDraft.point.lng], { icon: this.endIcon })
        .bindPopup(`<strong>Destination (B)</strong><br>${escapeHtml(this.toDraft.label)}`)
        .addTo(this.pickLayer);
    }
  }

  renderRoute(result, from, to) {
    this.clearAll();

    for (const group of result.bestRoute.segmentGroups) {
      const shaded = Boolean(group.shaded);
      L.polyline(group.points, {
        pane: 'routePane',
        color: shaded ? '#0f766e' : '#ea580c',
        weight: 6,
        opacity: 0.96,
        dashArray: shaded ? null : '9 9',
        lineCap: 'round'
      }).addTo(this.routeLayer);
    }

    L.marker([from.lat, from.lng], { icon: this.startIcon })
      .bindPopup(`<strong>Start</strong><br>${escapeHtml(from.label)}`)
      .addTo(this.markerLayer);

    L.marker([to.lat, to.lng], { icon: this.endIcon })
      .bindPopup(`<strong>Destination</strong><br>${escapeHtml(to.label)}`)
      .addTo(this.markerLayer);

    if (result.bestRoute.shadowEnd) {
      L.circleMarker(result.bestRoute.shadowEnd.point, {
        radius: 6,
        color: '#111827',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1
      })
        .bindPopup(`Shadow end<br>Remaining exposed: ${formatMeters(result.bestRoute.shadowEnd.remainingMeters)}`)
        .addTo(this.helperLayer);
    }

    if (result.podDispatch?.dispatched) {
      const pickup = [result.podDispatch.pickup.lat, result.podDispatch.pickup.lng];
      const destination = [result.podDispatch.destination.lat, result.podDispatch.destination.lng];

      L.circleMarker(pickup, {
        radius: 7,
        color: '#b91c1c',
        weight: 2,
        fillColor: '#fecaca',
        fillOpacity: 1
      })
        .bindPopup(`${escapeHtml(result.podDispatch.vehicleType)} ${escapeHtml(result.podDispatch.dispatchId)}`)
        .addTo(this.helperLayer);

      L.polyline([pickup, destination], {
        color: '#b91c1c',
        weight: 3,
        opacity: 0.85,
        dashArray: '4 8'
      }).addTo(this.helperLayer);
    }

    this.fitToGeometry(result.bestRoute.geometry);
  }

  fitToGeometry(geometry) {
    if (!Array.isArray(geometry) || geometry.length < 2) {
      return;
    }

    this.map.fitBounds(L.latLngBounds(geometry).pad(0.16), { animate: true, duration: 0.4 });
  }
}
