import fs from "fs";
import os from "os";
import path from "path";

/** Vercel serverless only allows writing under os.tmpdir(). */
export function getUploadsDir() {
  if (process.env.VERCEL === "1") {
    const dir = path.join(os.tmpdir(), "mollure-uploads");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  const dir = path.resolve(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
