import { escapeHtml } from '../utils/format.mjs';

const STATUS_TEXT = {
  green: 'On Track',
  yellow: 'Needs Attention',
  red: 'Losing Focus'
};

export class WorkerOverlay {
  constructor(map, { workers = [], onSelect = null } = {}) {
    this.map = map;
    this.workers = Array.isArray(workers) ? workers : [];
    this.onSelect = typeof onSelect === 'function' ? onSelect : null;
    this.iconCache = new Map();

    this.map.createPane('workerMarkerPane');
    this.map.getPane('workerMarkerPane').style.zIndex = '650';

    this.layer = L.layerGroup().addTo(map);
    this.addLegend();
  }

  setWorkers(workers) {
    this.workers = Array.isArray(workers) ? workers : [];
  }

  getWorkers() {
    return this.workers;
  }

  getWorkerById(workerId) {
    return this.workers.find((worker) => worker.id === workerId) || null;
  }

  render({ focus = true } = {}) {
    this.layer.clearLayers();

    for (const worker of this.workers) {
      const marker = L.marker(worker.position, {
        icon: this.getIcon(worker.status),
        pane: 'workerMarkerPane'
      });

      marker
        .bindPopup(
          [
            `<strong>${escapeHtml(worker.name)}</strong>`,
            `${escapeHtml(worker.role)} (${escapeHtml(worker.id)})`,
            `Status: ${escapeHtml(STATUS_TEXT[worker.status] || 'Unknown')}`,
            `Zone: ${escapeHtml(worker.zone || 'Unknown')}`
          ].join('<br>')
        )
        .addTo(this.layer);

      marker.on('click', () => {
        this.onSelect?.(worker.id);
      });
    }

    if (focus && this.workers.length) {
      const bounds = L.latLngBounds(this.workers.map((worker) => worker.position));
      this.map.fitBounds(bounds.pad(0.35), { animate: true, duration: 0.5 });
    }
  }

  getIcon(status) {
    const normalizedStatus = status === 'green' || status === 'yellow' || status === 'red' ? status : 'yellow';
    if (this.iconCache.has(normalizedStatus)) {
      return this.iconCache.get(normalizedStatus);
    }

    const icon = L.divIcon({
      className: '',
      html: `<div class="worker-pin worker-pin--${normalizedStatus}"><span class="worker-pin__icon" aria-hidden="true">👷</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -14]
    });

    this.iconCache.set(normalizedStatus, icon);
    return icon;
  }

  addLegend() {
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const container = L.DomUtil.create('div', 'worker-legend');
      container.innerHTML = `
        <h4>NYUAD Worker Status</h4>
        <div class="worker-legend__row"><span class="worker-legend__dot worker-legend__dot--green"></span>Green: On Track</div>
        <div class="worker-legend__row"><span class="worker-legend__dot worker-legend__dot--yellow"></span>Yellow: Needs Attention</div>
        <div class="worker-legend__row"><span class="worker-legend__dot worker-legend__dot--red"></span>Red: Losing Focus</div>
      `;
      L.DomEvent.disableClickPropagation(container);
      return container;
    };
    legend.addTo(this.map);
  }
}
