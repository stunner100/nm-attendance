export const THEME_STORAGE_KEY = "nm-hr-theme";

export const THEME_IDS = [
  "default",
  "slate",
  "sand",
  "mint",
  "sky",
  "linen",
  "purple",
  "night",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemePreset = {
  id: ThemeId;
  label: string;
  description: string;
  /** Preview swatch: background + accent dot */
  preview: { canvas: string; accent: string };
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "Geist",
    description: "Vercel Geist light — minimal high-contrast surfaces.",
    preview: { canvas: "#ffffff", accent: "#171717" },
  },
  {
    id: "slate",
    label: "Slate",
    description: "Cool gray surfaces with a deep slate primary.",
    preview: { canvas: "#f4f6f8", accent: "#2c3340" },
  },
  {
    id: "sand",
    label: "Sand",
    description: "Warm off-white with earthy brown accents.",
    preview: { canvas: "#faf6f0", accent: "#4a3f35" },
  },
  {
    id: "mint",
    label: "Mint",
    description: "Soft green-tinted workspace with forest primary.",
    preview: { canvas: "#f3f8f5", accent: "#0a2e0e" },
  },
  {
    id: "sky",
    label: "Sky",
    description: "Light blue-gray canvas with navy primary.",
    preview: { canvas: "#f2f6fb", accent: "#1a3866" },
  },
  {
    id: "linen",
    label: "Linen",
    description: "Blush cream surfaces with coral accent buttons.",
    preview: { canvas: "#faf8f5", accent: "#aa2d00" },
  },
  {
    id: "purple",
    label: "Purple",
    description: "Soft lavender canvas with violet primary buttons.",
    preview: { canvas: "#f7f4fb", accent: "#5b21b6" },
  },
  {
    id: "night",
    label: "Night",
    description: "Dark workbench with light ink and soft borders.",
    preview: { canvas: "#0a0a0a", accent: "#ededed" },
  },
];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") {
    return "default";
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : "default";
  } catch {
    return "default";
  }
}

export function applyThemeToDocument(themeId: ThemeId): void {
  const root = document.documentElement;
  if (themeId === "default") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", themeId);
  }
}

export function persistTheme(themeId: ThemeId): void {
  try {
    if (themeId === "default") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  } catch {
    // Ignore private browsing / storage quota errors.
  }
}
