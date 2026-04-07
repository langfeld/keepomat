import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { resolve } from "path";
import { eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";

import { db, runMigrations, setupFTS } from "../db";
import { auth, handlePostRegistration } from "./auth";
import { authGuard, adminGuard } from "./middleware/auth";

// Routes
import { bookmarkRoutes } from "./routes/bookmarks";
import { folderRoutes } from "./routes/folders";
import { tagRoutes } from "./routes/tags";
import { searchRoutes } from "./routes/search";
import { settingsRoutes } from "./routes/settings";
import { adminRoutes } from "./routes/admin";
import { exportRoutes } from "./routes/export";
import { apiKeyRoutes } from "./routes/api-keys";

// Bot
import { startAllUserBots } from "../bot";

const app = new Hono();

// ── Middleware ──
app.use("*", logger());

// Security-Header
app.use("*", secureHeaders({
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  ...(process.env.NODE_ENV === "production" ? {
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
  } : {}),
}));

// CORS – TRUSTED_ORIGINS + localhost:5173 im Development-Modus
const corsOrigins = [process.env.BETTER_AUTH_URL || "http://localhost:3000"];
if (process.env.TRUSTED_ORIGINS) {
  corsOrigins.push(...process.env.TRUSTED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean));
}
if (process.env.NODE_ENV !== "production") {
  corsOrigins.push("http://localhost:5173");
}
app.use(
  "/api/*",
  cors({
    origin: corsOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

// ── Health Check ──
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    name: "Keepomat",
    version: "0.1.0",
    uptime: process.uptime(),
  });
});

// ── Öffentliche Route: Registrierungsstatus ──
app.get("/api/registration-status", async (c) => {
  const userCount = db.select({ count: sql<number>`count(*)` }).from(schema.users).get();
  const registrationSetting = db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.key, "registration_enabled"))
    .get();

  return c.json({
    isFirstUser: (userCount?.count || 0) === 0,
    registrationEnabled: registrationSetting?.value !== "false",
  });
});

// ── Better Auth Handler ──
app.all("/api/auth/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  // Post-Registration Hook (Admin setzen, Settings erstellen)
  handlePostRegistration(c.req.raw, response).catch(() => {});
  return response;
});

// ── Geschützte API-Routes ──
// Auth-Guards – doppelt registriert für Root und Sub-Pfade
for (const path of ["/api/bookmarks", "/api/folders", "/api/tags", "/api/search", "/api/settings", "/api/keys", "/api/export"]) {
  app.use(`${path}`, authGuard);
  app.use(`${path}/*`, authGuard);
}
app.use("/api/admin", authGuard, adminGuard);
app.use("/api/admin/*", authGuard, adminGuard);

app.route("/api/bookmarks", bookmarkRoutes);
app.route("/api/folders", folderRoutes);
app.route("/api/tags", tagRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/keys", apiKeyRoutes);
app.route("/api/export", exportRoutes);
app.route("/api/admin", adminRoutes);

// ── Userscript ausliefern ──
app.get("/keepomat.user.js", async (c) => {
  const scriptPath = resolve(import.meta.dir, "../../keepomat.user.js");
  const file = Bun.file(scriptPath);
  let content = await file.text();

  // Server-URL dynamisch einsetzen
  const baseUrl = (process.env.BETTER_AUTH_URL || `http://localhost:${parseInt(process.env.PORT || "3000", 10)}`).replace(/\/$/, "");
  content = content.replace("{{DOWNLOAD_URL}}", `${baseUrl}/keepomat.user.js`);
  content = content.replace("{{UPDATE_URL}}", `${baseUrl}/keepomat.user.js`);

  return c.text(content, 200, {
    "Content-Type": "text/javascript",
    "Content-Disposition": 'inline; filename="keepomat.user.js"',
  });
});

// ── Statische Dateien (Production) ──
if (process.env.NODE_ENV === "production") {
  const frontendPath = resolve(import.meta.dir, "../../dist/frontend");

  app.use("/*", serveStatic({ root: frontendPath }));

  // SPA-Fallback: Alle nicht-API Routen → index.html
  app.get("*", serveStatic({ path: resolve(frontendPath, "index.html") }));
}

// ── Server starten ──
const port = parseInt(process.env.PORT || "3000", 10);

// Datenbank initialisieren
runMigrations();
setupFTS();

// Telegram Bots starten (alle User mit konfigurierten Tokens)
startAllUserBots().catch((err: Error) =>
  console.error("❌ Telegram Bot error:", err.message)
);

console.log(`
╔══════════════════════════════════════╗
║         🔖  Keepomat v0.1.0         ║
║   Smart Bookmark Manager with AI    ║
╠══════════════════════════════════════╣
║  Server:  http://localhost:${port}       ║
║  Mode:    ${(process.env.NODE_ENV || "development").padEnd(24)}║
╚══════════════════════════════════════╝
`);

export default {
  port,
  fetch: app.fetch,
};
