export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(new Date(value));
}
