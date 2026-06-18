"use client";

import { Check, Palette } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { THEME_PRESETS, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  className?: string;
};

function ThemeSwatch({
  themeId,
  label,
  preview,
  selected,
  onSelect,
}: {
  themeId: ThemeId;
  label: string;
  preview: { canvas: string; accent: string };
  selected: boolean;
  onSelect: (id: ThemeId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(themeId)}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
        "border-[var(--color-rule)] bg-[var(--color-paper)] hover:bg-[var(--color-paper-2)]",
        selected &&
          "border-[var(--color-border-strong)] ring-2 ring-[var(--color-focus)]/35"
      )}
      aria-pressed={selected}
      aria-label={`${label} theme`}
    >
      <span
        className="relative flex h-10 w-full items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-rule)]"
        style={{ backgroundColor: preview.canvas }}
      >
        <span
          className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: preview.accent }}
        />
        {selected ? (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)]">
            <Check className="h-2.5 w-2.5" aria-hidden />
          </span>
        ) : null}
      </span>
      <span className="w-full text-center text-xs font-medium text-[var(--color-ink)]">
        {label}
      </span>
    </button>
  );
}

export function ThemePicker({ className }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();
  const active = THEME_PRESETS.find((preset) => preset.id === theme) ?? THEME_PRESETS[0];

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-sm font-medium text-[var(--color-ink)]">Color theme</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a workspace background and accent. Your choice is saved in this browser.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {THEME_PRESETS.map((preset) => (
          <ThemeSwatch
            key={preset.id}
            themeId={preset.id}
            label={preset.label}
            preview={preset.preview}
            selected={theme === preset.id}
            onSelect={setTheme}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Active: <span className="font-medium text-[var(--color-ink)]">{active.label}</span>
        {" — "}
        {active.description}
      </p>
    </div>
  );
}

export function ThemePickerMenu() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full text-[var(--color-ink-2)]"
        aria-label="Change color theme"
        disabled
      >
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full text-[var(--color-ink-2)]"
          aria-label="Change color theme"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">Color theme</p>
        <div className="grid grid-cols-4 gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setTheme(preset.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[var(--radius-sm)] p-1.5 transition-colors hover:bg-[var(--color-paper-2)]",
                theme === preset.id && "bg-[var(--color-paper-2)] ring-1 ring-[var(--color-rule)]"
              )}
              aria-pressed={theme === preset.id}
              aria-label={preset.label}
              title={preset.label}
            >
              <span
                className="flex h-8 w-full items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-rule)]"
                style={{ backgroundColor: preset.preview.canvas }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.preview.accent }}
                />
              </span>
              <span className="truncate text-[10px] text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
