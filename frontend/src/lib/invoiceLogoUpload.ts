/** Compress invoice logos so base64 fits finance settings JSON (express body limit). */

const MAX_EDGE = 512;
const JPEG_QUALITY = 0.82;
const MAX_DATA_URL_CHARS = 900_000; // ~0.7MB payload headroom under 2mb JSON

export const INVOICE_LOGO_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
export const INVOICE_LOGO_HINT = "PNG, JPG, or WebP up to 5MB";

export function isAllowedInvoiceLogoFile(file: File): boolean {
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    name.endsWith(".svg") ||
    type === "image/svg+xml"
  ) {
    return false;
  }
  return (
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/webp" ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image."));
    img.src = url;
  });
}

/** Read + downscale to JPEG data URL (keeps logo under API body limits). */
export async function fileToInvoiceLogoDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height, 1));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image.");
    ctx.drawImage(img, 0, 0, width, height);
    let quality = JPEG_QUALITY;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > MAX_DATA_URL_CHARS && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error("Logo is too large after compression. Try a smaller image.");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
