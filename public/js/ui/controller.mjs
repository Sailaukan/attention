import { escapeHtml, formatMeters } from '../utils/format.mjs';

export function createUiController(dom) {
  function setStatus(message, isError = false) {
    dom.statusBox.textContent = message;
    dom.statusBox.style.borderColor = isError ? 'rgba(185, 28, 28, 0.45)' : 'rgba(11, 23, 33, 0.14)';
    dom.statusBox.style.background = isError ? '#fee2e2' : '#f8fafc';
    dom.statusBox.style.color = isError ? '#7f1d1d' : '#334155';
  }

  function setLoading(loading) {
    dom.planBtn.disabled = loading;
    dom.planBtn.textContent = loading ? 'Calculating...' : 'Build Cool Route';
  }

  function setPickMode(mode) {
    const fromActive = mode === 'from';
    const toActive = mode === 'to';

    dom.pickFromBtn.style.borderColor = fromActive ? '#0f766e' : '#cbd5e1';
    dom.pickFromBtn.style.background = fromActive ? '#ecfeff' : '#ffffff';
    dom.pickToBtn.style.borderColor = toActive ? '#0f766e' : '#cbd5e1';
    dom.pickToBtn.style.background = toActive ? '#ecfeff' : '#ffffff';
    dom.pickHint.classList.toggle('hidden', !mode);
    dom.pickHint.textContent = mode ? `Tap map to set ${mode === 'from' ? 'Start (A)' : 'Destination (B)'} location.` : '';
  }

  function updateSummary(summary) {
    dom.distanceValue.textContent = formatMeters(summary.distanceMeters);
    dom.durationValue.textContent = `${summary.durationMinutes} min`;
    dom.shadeValue.textContent = `${summary.shadeRatio}%`;
    dom.sunnyValue.textContent = formatMeters(summary.sunnyMeters);
  }

  function updatePod(podDispatch, shadowEnd) {
    if (podDispatch?.dispatched) {
      dom.podStatus.innerHTML = [
        `<strong>${escapeHtml(podDispatch.vehicleType)} dispatched</strong> (${escapeHtml(podDispatch.dispatchId)})`,
        `ETA: ${podDispatch.etaMinutes} min`,
        `Pickup: ${podDispatch.pickup.lat.toFixed(5)}, ${podDispatch.pickup.lng.toFixed(5)}`
      ].join('<br>');
      return;
    }

    if (shadowEnd?.remainingMeters >= 500) {
      dom.podStatus.textContent = 'Pod dispatch skipped because autonomous mode is disabled.';
      return;
    }

    dom.podStatus.textContent = 'No pod dispatch needed. Route remains shaded close to destination.';
  }

  function updateAlternatives(alternatives) {
    if (!Array.isArray(alternatives) || !alternatives.length) {
      dom.alternativesBox.textContent = 'No computed routes yet.';
      return;
    }

    const rows = alternatives.map((route) => `<div class="alt-row">
      <div><strong>${escapeHtml(route.name)}</strong><br><small>${route.shadeRatio}% shaded</small></div>
      <div>${formatMeters(route.distanceMeters)}</div>
      <div>${route.durationMinutes} min</div>
    </div>`);

    dom.alternativesBox.innerHTML = rows.join('');
  }

  function resetMetrics() {
    dom.distanceValue.textContent = '-';
    dom.durationValue.textContent = '-';
    dom.shadeValue.textContent = '-';
    dom.sunnyValue.textContent = '-';
    dom.podStatus.textContent = 'No active pod dispatch.';
    dom.alternativesBox.textContent = 'No computed routes yet.';
  }

  return {
    setStatus,
    setLoading,
    setPickMode,
    updateSummary,
    updatePod,
    updateAlternatives,
    resetMetrics
  };
}
