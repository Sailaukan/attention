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

    const statusGradient = {
      green: 'linear-gradient(145deg, #16a34a, #15803d)',
      yellow: 'linear-gradient(145deg, #facc15, #ca8a04)',
      red: 'linear-gradient(145deg, #ef4444, #b91c1c)'
    };

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:30px;height:30px;border-radius:9999px;border:2px solid #fff;display:grid;place-items:center;box-shadow:0 8px 18px rgba(2, 6, 23, 0.35);background:${statusGradient[normalizedStatus]};"><span aria-hidden="true" style="font-size:14px;line-height:1;">👷</span></div>`,
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
      const container = L.DomUtil.create('div', '');
      container.style.cssText = 'background:rgba(255,255,255,0.95);border:1px solid rgba(15,23,42,0.18);border-radius:10px;padding:8px 10px;box-shadow:0 8px 20px rgba(2,6,23,0.2);color:#0f172a;font-size:12px;line-height:1.35;';
      container.innerHTML = `
        <h4 style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">MBZUAI Worker Status</h4>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:9999px;display:inline-block;background:#16a34a;"></span>Green: On Track</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:9999px;display:inline-block;background:#eab308;"></span>Yellow: Needs Attention</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:9999px;display:inline-block;background:#dc2626;"></span>Red: Losing Focus</div>
      `;
      L.DomEvent.disableClickPropagation(container);
      return container;
    };
    legend.addTo(this.map);
  }
}
