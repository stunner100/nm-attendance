function repairMergedCsvLine(line: string): string[] {
  const patterns = [
    /^(.+?\bcontract_type)\s+(EMP[-\w]+,.*)$/i,
    /^((?:[^,]*,){3}[^,]*)\s+(\S.*)$/,
    /^(.+?\brole_title)\s+([^,].*,.*)$/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
  }

  return [line];
}

export function normalizeImportedText(text: string): string {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (line.includes(",")) {
        return [line];
      }

      if (line.includes("\t")) {
        return [line.replace(/\t+/g, ",")];
      }

      return [line.replace(/\s{2,}/g, ",")];
    });

  if (lines.length === 1) {
    return repairMergedCsvLine(lines[0]).join("\n");
  }

  return lines.join("\n");
}
