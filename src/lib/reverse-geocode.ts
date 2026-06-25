type NominatimAddress = {
  house_number?: string;
  road?: string;
  footway?: string;
  path?: string;
  pedestrian?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

type BigDataCloudLocalityInfo = {
  name?: string;
  description?: string;
  order?: number;
};

type BigDataCloudResponse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
  postcode?: string;
  localityInfo?: {
    administrative?: BigDataCloudLocalityInfo[];
    informative?: BigDataCloudLocalityInfo[];
  };
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

export function buildNominatimLabel(address: NominatimAddress | undefined): string | null {
  if (!address) {
    return null;
  }

  const street = [address.house_number, address.road ?? address.footway ?? address.path ?? address.pedestrian]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const area = address.neighbourhood ?? address.suburb ?? address.quarter;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;

  const label = formatPlaceLabel([street, area, city, address.county, address.state, address.country]);
  return label ? label.slice(0, 200) : null;
}

function buildBigDataCloudLabel(data: BigDataCloudResponse): string | null {
  const informativeNames =
    data.localityInfo?.informative
      ?.map((entry) => entry.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  const administrativeNames =
    data.localityInfo?.administrative
      ?.map((entry) => entry.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  const finerArea = informativeNames[0] ?? administrativeNames.at(-2);

  const label = formatPlaceLabel([
    finerArea,
    data.locality,
    data.postcode,
    data.city,
    data.principalSubdivision,
    data.countryName,
  ]);

  return label ? label.slice(0, 200) : null;
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
    return buildBigDataCloudLabel(data);
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
    const structured = buildNominatimLabel(data.address);
    if (structured) {
      return structured;
    }

    const label = data.display_name?.trim();
    return label ? label.slice(0, 200) : null;
  } catch {
    return null;
  }
}

export function pickMoreSpecificLabel(primary: string | null, fallback: string | null): string | null {
  if (!primary) {
    return fallback;
  }

  if (!fallback) {
    return primary;
  }

  const primaryParts = primary.split(",").map((part) => part.trim()).filter(Boolean);
  const fallbackParts = fallback.split(",").map((part) => part.trim()).filter(Boolean);

  if (primaryParts.length > fallbackParts.length) {
    return primary;
  }

  if (fallbackParts.length > primaryParts.length) {
    return fallback;
  }

  if (primary.length >= fallback.length) {
    return primary;
  }

  return fallback;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const [nominatim, bigDataCloud] = await Promise.all([
    reverseGeocodeNominatim(latitude, longitude),
    reverseGeocodeBigDataCloud(latitude, longitude),
  ]);

  return pickMoreSpecificLabel(nominatim, bigDataCloud);
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

export function formatLocationWithCoordinates(
  label: string | null | undefined,
  latitude: number | null,
  longitude: number | null
): string {
  const coordinates = formatCoordinatesLabel(latitude, longitude);
  const trimmed = label?.trim();

  if (trimmed && coordinates && !looksLikeCoordinatesLabel(trimmed)) {
    return `${trimmed} · ${coordinates}`;
  }

  if (trimmed) {
    return trimmed;
  }

  return coordinates ?? "—";
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

export function shouldRefreshLocationLabel(
  location: string | null | undefined,
  latitude: number | null,
  longitude: number | null
): boolean {
  if (needsLocationBackfill(location, latitude, longitude)) {
    return true;
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  const trimmed = location?.trim();
  if (!trimmed || looksLikeCoordinatesLabel(trimmed)) {
    return false;
  }

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length <= 3;
}
