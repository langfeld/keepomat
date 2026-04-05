import { Hono } from "hono";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import { createApiKeySchema } from "../../shared/validators";
import { hashApiKey } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

export const apiKeyRoutes = new Hono();

// Alle API-Keys des Users auflisten
apiKeyRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;

  const keys = db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      createdAt: schema.apiKeys.createdAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, user.id))
    .all();

  return c.json(keys);
});

// Neuen API-Key generieren
apiKeyRoutes.post("/", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  // Key generieren
  const rawKey = `kpo_${uuidv4().replace(/-/g, "")}`;
  const keyHash = await hashApiKey(rawKey);

  const apiKey = db
    .insert(schema.apiKeys)
    .values({
      userId: user.id,
      keyHash,
      name: parsed.data.name,
    })
    .returning()
    .get();

  // Den Klartext-Key nur einmal zurückgeben!
  return c.json(
    {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // Nur bei Erstellung sichtbar
      createdAt: apiKey.createdAt,
    },
    201
  );
});

// API-Key löschen
apiKeyRoutes.delete("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const existing = db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.id, id))
    .get();

  if (!existing || existing.userId !== user.id) {
    return c.json({ error: "API-Key nicht gefunden" }, 404);
  }

  db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id)).run();
  return c.json({ success: true });
});
