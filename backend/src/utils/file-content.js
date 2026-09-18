/**
 * Magic-byte sniffing for upload safety (no new deps).
 * Returns a canonical MIME or null if unrecognized / unsafe.
 */

import path from "path";

// ponytail: prebuilt sharp reports heif but only AVIF (no HEVC). Do not add a converter dep; store HEIC as-is. Windows Chrome uses existing file-chip via img onError. Native HEVC in sharp if display-on-Windows is required.
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
  "text/csv": ".csv",
};

function startsWith(buf, bytes, offset = 0) {
  if (!buf || buf.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buf[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function isMostlyText(buf) {
  if (!buf?.length) return false;
  let suspicious = 0;
  const n = Math.min(buf.length, 4096);
  for (let i = 0; i < n; i += 1) {
    const b = buf[i];
    if (b === 0) return false;
    if (b < 7 || (b > 14 && b < 32 && b !== 9 && b !== 10 && b !== 13)) {
      suspicious += 1;
    }
  }
  return suspicious / n < 0.05;
}

function sniffHeifFamily(buf) {
  // ISO BMFF: size(4) + 'ftyp'(4) + brand(4)
  if (buf.length < 12 || buf.toString("ascii", 4, 8) !== "ftyp") return null;
  const brand = buf.toString("ascii", 8, 12).toLowerCase();
  if (["heic", "heix", "heim", "heis"].includes(brand)) return "image/heic";
  if (["heif", "hevc", "hevx", "mif1", "msf1"].includes(brand)) return "image/heif";
  return null;
}

/**
 * Multer `originalname` can be a Windows path (`C:\Users\foo\photo.jpg`).
 * POSIX `path.extname` of that string is empty, so upload filters reject it.
 */
export function extensionFromOriginalName(originalName) {
  const base = String(originalName || "").split(/[/\\]/).pop() || "";
  return path.extname(base).toLowerCase();
}

/** @returns {string | null} canonical MIME */
export function sniffMimeFromBuffer(buffer, hintExt = "") {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;

  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (
    startsWith(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }

  const heif = sniffHeifFamily(buffer);
  if (heif) return heif;

  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";

  // OLE Compound File (legacy .doc / .xls)
  if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    const ext = String(hintExt || "").toLowerCase();
    if (ext === ".xls") return "application/vnd.ms-excel";
    return "application/msword";
  }

  // ZIP container (docx / xlsx). ponytail: brand via ext only; unzip parse if spoofing becomes an issue.
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buffer, [0x50, 0x4b, 0x05, 0x06])) {
    const ext = String(hintExt || "").toLowerCase();
    if (ext === ".xlsx") {
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    if (ext === ".docx") {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return null;
  }

  if (isMostlyText(buffer)) {
    const ext = String(hintExt || "").toLowerCase();
    if (ext === ".csv") return "text/csv";
    return "text/plain";
  }

  return null;
}

export function extensionForMime(mime) {
  return EXT_BY_MIME[mime] || "";
}

export function isImageMime(mime) {
  return IMAGE_MIMES.has(mime);
}

/**
 * Mutates multer file: sets trusted mimetype + detectedExt from content.
 * @throws {Error} when content does not match allowed set
 */
export function assertTrustedUploadFile(file, { allowedMimes }) {
  if (!file?.buffer?.length) {
    throw Object.assign(new Error("Empty file upload."), { statusCode: 400 });
  }

  const hintExt = extensionFromOriginalName(file.originalname);

  const sniffed = sniffMimeFromBuffer(file.buffer, hintExt);
  if (!sniffed || !allowedMimes.has(sniffed)) {
    throw Object.assign(
      new Error("File content does not match an allowed type."),
      { statusCode: 400 },
    );
  }

  file.mimetype = sniffed;
  file.detectedExt = extensionForMime(sniffed) || hintExt || ".bin";
  return file;
}

export function collectMulterFiles(filesField) {
  if (!filesField) return [];
  if (Array.isArray(filesField)) return filesField.filter(Boolean);
  const out = [];
  for (const value of Object.values(filesField)) {
    if (Array.isArray(value)) out.push(...value);
    else if (value) out.push(value);
  }
  return out;
}
