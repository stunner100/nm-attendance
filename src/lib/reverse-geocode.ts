type NominatimResponse = {
  display_name?: string;
};

type BigDataCloudResponse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
};

const COORDINATE_PATTERN = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

export function formatCoordinatesLabel(
  latitude: number | null,
  longitude: number | null
): string | null {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function looksLikeCoordinatesLabel(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  return COORDINATE_PATTERN.test(value.trim());
}

export function formatPlaceLabel(parts: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    labels.push(trimmed);
  }

  return labels.join(", ");
}

async function reverseGeocodeBigDataCloud(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", "en");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6_000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BigDataCloudResponse;
    const label = formatPlaceLabel([
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ]);

    return label ? label.slice(0, 200) : null;
  } catch {
    return null;
  }
}

async function reverseGeocodeNominatim(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NightMarketHR/1.0 (attendance@nightmarkethr.vercel.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6_000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimResponse;
    const label = data.display_name?.trim();
    return label ? label.slice(0, 200) : null;
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const bigDataCloud = await reverseGeocodeBigDataCloud(latitude, longitude);
  if (bigDataCloud) {
    return bigDataCloud;
  }

  return reverseGeocodeNominatim(latitude, longitude);
}

export async function resolveLocationLabel(
  latitude: number,
  longitude: number
): Promise<string> {
  const geocoded = await reverseGeocode(latitude, longitude);
  if (geocoded) {
    return geocoded;
  }

  return formatCoordinatesLabel(latitude, longitude) ?? "Unknown location";
}

export function needsLocationBackfill(
  location: string | null | undefined,
  latitude: number | null,
  longitude: number | null
): boolean {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  if (!location?.trim()) {
    return true;
  }

  return looksLikeCoordinatesLabel(location);
}
