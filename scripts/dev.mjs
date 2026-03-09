/**
 * Dev server launcher with route pre-warming.
 * Starts `next dev --turbo`, waits until ready, then pre-compiles every
 * known route so the first click is instant.
 */

import { spawn } from "child_process";
import http from "http";

const PORT = process.env.PORT || 3001;
const BASE = `http://localhost:${PORT}`;

// All static routes in the app (slug routes are skipped — they need real ids)
const ROUTES = [
  "/auth",
  "/dashboard",
  "/profile",
  "/forms/new",
];

// ── Start next dev --turbo ─────────────────────────────────────────────────
// Spawn next dev --turbo; embed all args in the command string so Node's
// shell-escaping deprecation warning is not triggered.
const next = spawn(`npx next dev --turbo --port ${PORT}`, {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
});

let ready = false;

const forward = (chunk) => {
  process.stdout.write(chunk);
  if (!ready && chunk.toString().includes("Ready in")) {
    ready = true;
    warmup();
  }
};

next.stdout.on("data", forward);
next.stderr.on("data", (c) => process.stderr.write(c));
next.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => next.kill("SIGINT"));
process.on("SIGTERM", () => next.kill("SIGTERM"));

// ── Wait for server to accept connections, then hit every route ───────────
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(`${BASE}/api/auth/providers`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (retries-- <= 0) return reject(new Error("Server did not start"));
        setTimeout(attempt, 500);
      });
      req.end();
    };
    attempt();
  });
}

async function warmup() {
  try {
    await waitForServer();
    console.log("\n\x1b[36m▲ Pre-warming routes...\x1b[0m");
    await Promise.all(
      ROUTES.map((route) =>
        fetch(`${BASE}${route}`, {
          headers: { "x-warmup": "1" },
          redirect: "manual",
        })
          .then(() => console.log(`  \x1b[32m✓\x1b[0m ${route}`))
          .catch(() => console.log(`  \x1b[33m~\x1b[0m ${route} (retrying on first visit)`))
      )
    );
    console.log("\x1b[36m▲ All routes compiled — clicks will be instant.\x1b[0m\n");
  } catch (e) {
    console.warn("Warmup skipped:", e.message);
  }
}
