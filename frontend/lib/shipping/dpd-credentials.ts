import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Parse a simple KEY=VALUE .env file (no variable expansion). */
function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * Read DPD login from .env at runtime so password changes work without rebuild.
 * (Next.js can inline process.env.* into the production bundle at build time.)
 */
export function getDpdCredentials(): { username: string; password: string } {
  const cwd = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const env = parseEnvFile(join(cwd, name));
    const username = (env.DPD_USERNAME || env.DPD_ESERVISS_USERNAME || "").trim();
    const password = (env.DPD_PASSWORD || env.DPD_ESERVISS_PASSWORD || "").trim();
    if (username && password) {
      return { username, password };
    }
  }
  return {
    username: (
      process.env["DPD_USERNAME"] ||
      process.env["DPD_ESERVISS_USERNAME"] ||
      ""
    ).trim(),
    password: (
      process.env["DPD_PASSWORD"] ||
      process.env["DPD_ESERVISS_PASSWORD"] ||
      ""
    ).trim(),
  };
}
