import fs from "fs";
import path from "path";

export function getUploadsDir() {
  const dir = path.resolve(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
