export function asLatitude(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "number" || Number.isNaN(value) || value < -90 || value > 90) {
    return null;
  }

  return value;
}

export function asLongitude(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    value < -180 ||
    value > 180
  ) {
    return null;
  }

  return value;
}

export function buildOpenStreetMapUrl(
  latitude: number | null,
  longitude: number | null
): string | null {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}
