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
