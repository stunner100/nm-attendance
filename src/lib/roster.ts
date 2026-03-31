function dedupeRosterNames(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const candidate of values) {
    const normalizedName = candidate.trim();
    if (!normalizedName) {
      continue;
    }

    const dedupeKey = normalizedName.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    names.push(normalizedName);
  }

  return names;
}

export function normalizeRosterName(name: string): string {
  return name.trim();
}

export function normalizeRosterNames(names: string[]): string[] {
  return dedupeRosterNames(names);
}

export function splitRosterNames(rawNames: string): string[] {
  return dedupeRosterNames(rawNames.split(/[\n,;]+/));
}
