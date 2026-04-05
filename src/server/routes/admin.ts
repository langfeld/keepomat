import { Hono } from "hono";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { updateSystemSettingsSchema } from "../../shared/validators";

export const adminRoutes = new Hono();

// Dashboard-Statistiken (Admin)
adminRoutes.get("/stats", async (c) => {
  const userCount = db.select({ count: sql<number>`count(*)` }).from(schema.users).get();
  const bookmarkCount = db.select({ count: sql<number>`count(*)` }).from(schema.bookmarks).get();
  const folderCount = db.select({ count: sql<number>`count(*)` }).from(schema.folders).get();
  const tagCount = db.select({ count: sql<number>`count(*)` }).from(schema.tags).get();

  return c.json({
    users: userCount?.count || 0,
    bookmarks: bookmarkCount?.count || 0,
    folders: folderCount?.count || 0,
    tags: tagCount?.count || 0,
  });
});

// Alle User auflisten
adminRoutes.get("/users", async (c) => {
  const users = db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      isAdmin: schema.users.isAdmin,
      isDisabled: schema.users.isDisabled,
      createdAt: schema.users.createdAt,
      bookmarkCount: sql<number>`(
        SELECT COUNT(*) FROM bookmarks WHERE bookmarks.user_id = ${schema.users.id}
      )`,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .all();

  return c.json(users);
});

// User sperren/entsperren
adminRoutes.patch("/users/:id/toggle-disable", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user" as never) as any;

  if (id === currentUser.id) {
    return c.json({ error: "Du kannst dich nicht selbst sperren" }, 400);
  }

  const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!user) return c.json({ error: "Benutzer nicht gefunden" }, 404);

  const updated = db
    .update(schema.users)
    .set({ isDisabled: !user.isDisabled, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning()
    .get();

  return c.json(updated);
});

// User Admin-Rechte ändern
adminRoutes.patch("/users/:id/toggle-admin", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user" as never) as any;

  if (id === currentUser.id) {
    return c.json({ error: "Du kannst dir nicht selbst die Admin-Rechte entziehen" }, 400);
  }

  const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!user) return c.json({ error: "Benutzer nicht gefunden" }, 404);

  const updated = db
    .update(schema.users)
    .set({ isAdmin: !user.isAdmin, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning()
    .get();

  return c.json(updated);
});

// User löschen
adminRoutes.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user" as never) as any;

  if (id === currentUser.id) {
    return c.json({ error: "Du kannst dich nicht selbst löschen" }, 400);
  }

  const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!user) return c.json({ error: "Benutzer nicht gefunden" }, 404);

  db.delete(schema.users).where(eq(schema.users.id, id)).run();
  return c.json({ success: true });
});

// System-Einstellungen abrufen
adminRoutes.get("/settings", async (c) => {
  const settings = db.select().from(schema.systemSettings).all();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.key.includes("key") || s.key.includes("token")
      ? s.value ? "***configured***" : ""
      : s.value;
  }
  return c.json(settingsMap);
});

// System-Einstellungen aktualisieren
adminRoutes.patch("/settings", async (c) => {
  const body = await c.req.json();
  const parsed = updateSystemSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      db.insert(schema.systemSettings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({
          target: schema.systemSettings.key,
          set: { value: String(value), updatedAt: new Date() },
        })
        .run();
    }
  }

  return c.json({ success: true });
});

// Registrierungsstatus prüfen (öffentlich zugänglich via separater Route)
adminRoutes.get("/registration-status", async (c) => {
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
