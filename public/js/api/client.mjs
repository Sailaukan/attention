export async function getRuntimeConfig() {
  const response = await fetch('/api/runtime-config');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Runtime config request failed.');
  }
  return data;
}

export async function geocodeFirst(query) {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Geocoding failed.');
  }
  return data.items?.[0] || null;
}

export async function reverseGeocode(lat, lng) {
  const url = new URL('/api/reverse-geocode', window.location.origin);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lng', String(lng));

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Reverse geocoding failed.');
  }

  return {
    label: data.label,
    lat: Number(data.lat),
    lng: Number(data.lng)
  };
}

export async function optimizeRoute(from, to, autoPod) {
  const response = await fetch('/api/optimize-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, autoPod })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Route optimization failed.');
  }

  return data;
}

export async function fetchBuildingFeatures({ south, west, north, east, signal }) {
  const url = new URL('/api/buildings', window.location.origin);
  url.searchParams.set('south', south.toFixed(6));
  url.searchParams.set('west', west.toFixed(6));
  url.searchParams.set('north', north.toFixed(6));
  url.searchParams.set('east', east.toFixed(6));

  const response = await fetch(url.toString(), { signal });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Building fetch failed.');
  }

  return Array.isArray(data.features) ? data.features : [];
}
