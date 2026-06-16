type NominatimResponse = {
  display_name?: string;
};

export function formatCoordinatesLabel(
  latitude: number | null,
  longitude: number | null
): string | null {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function reverseGeocode(
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
        "User-Agent": "NightMarketHR/1.0 (attendance)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6_000),
      next: { revalidate: 0 },
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
