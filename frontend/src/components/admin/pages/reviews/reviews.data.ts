export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function formatDisplayDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
