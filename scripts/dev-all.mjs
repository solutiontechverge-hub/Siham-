/**
 * Start frontend + backend together (Windows-safe, no extra deps).
 * Usage: npm run dev:all
 */
import { spawn } from "node:child_process";

const children = [];

function run(script) {
  const child = spawn("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    for (const other of children) {
      if (other !== child && !other.killed) other.kill(signal || "SIGTERM");
    }
    process.exit(code ?? 1);
  });
}

run("dev:backend");
run("dev:frontend");

const stop = () => {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
