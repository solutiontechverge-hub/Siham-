export function toSrc(img: unknown): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object") {
    const maybe = img as { src?: unknown; default?: unknown };
    if (typeof maybe.src === "string") return maybe.src;
    if (typeof maybe.default === "string") return maybe.default;
    if (typeof maybe.default === "object") return toSrc(maybe.default);
  }
  return String(img);
}

