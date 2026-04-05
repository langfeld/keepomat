import { Hono } from "hono";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createTagSchema, updateTagSchema, mergeTagsSchema } from "../../shared/validators";

export const tagRoutes = new Hono();

// Alle Tags des Users abrufen (mit Bookmark-Count)
tagRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;

  const tags = db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color,
      userId: schema.tags.userId,
      count: sql<number>`(
        SELECT COUNT(*) FROM bookmark_tags
        WHERE bookmark_tags.tag_id = ${schema.tags.id}
      )`,
    })
    .from(schema.tags)
    .where(eq(schema.tags.userId, user.id))
    .orderBy(schema.tags.name)
    .all();

  return c.json(tags);
});

// Tag erstellen
tagRoutes.post("/", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  // Prüfe auf Duplikat
  const existing = db
    .select()
    .from(schema.tags)
    .where(
      and(
        eq(schema.tags.name, parsed.data.name.toLowerCase()),
        eq(schema.tags.userId, user.id)
      )
    )
    .get();

  if (existing) {
    return c.json({ error: "Tag existiert bereits", existingId: existing.id }, 409);
  }

  const tag = db
    .insert(schema.tags)
    .values({
      name: parsed.data.name.toLowerCase(),
      color: parsed.data.color || null,
      userId: user.id,
    })
    .returning()
    .get();

  return c.json(tag, 201);
});

// Tag aktualisieren
tagRoutes.patch("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateTagSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const existing = db
    .select()
    .from(schema.tags)
    .where(and(eq(schema.tags.id, id), eq(schema.tags.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: "Tag nicht gefunden" }, 404);
  }

  const updateData: any = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name.toLowerCase();
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;

  const updated = db
    .update(schema.tags)
    .set(updateData)
    .where(eq(schema.tags.id, id))
    .returning()
    .get();

  return c.json(updated);
});

// Tag löschen
tagRoutes.delete("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const existing = db
    .select()
    .from(schema.tags)
    .where(and(eq(schema.tags.id, id), eq(schema.tags.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: "Tag nicht gefunden" }, 404);
  }

  db.delete(schema.tags).where(eq(schema.tags.id, id)).run();
  return c.json({ success: true });
});

// Tags zusammenführen (merge)
tagRoutes.post("/merge", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const parsed = mergeTagsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const { sourceTagId, targetTagId } = parsed.data;

  // Prüfe ob beide Tags dem User gehören
  const sourceTag = db
    .select()
    .from(schema.tags)
    .where(and(eq(schema.tags.id, sourceTagId), eq(schema.tags.userId, user.id)))
    .get();

  const targetTag = db
    .select()
    .from(schema.tags)
    .where(and(eq(schema.tags.id, targetTagId), eq(schema.tags.userId, user.id)))
    .get();

  if (!sourceTag || !targetTag) {
    return c.json({ error: "Tag nicht gefunden" }, 404);
  }

  // Alle Bookmark-Zuweisungen vom Source zum Target verschieben
  const sourceBookmarks = db
    .select()
    .from(schema.bookmarkTags)
    .where(eq(schema.bookmarkTags.tagId, sourceTagId))
    .all();

  for (const bt of sourceBookmarks) {
    db.insert(schema.bookmarkTags)
      .values({ bookmarkId: bt.bookmarkId, tagId: targetTagId })
      .onConflictDoNothing()
      .run();
  }

  // Source-Tag löschen (cascade löscht verbleibende bookmarkTags)
  db.delete(schema.tags).where(eq(schema.tags.id, sourceTagId)).run();

  return c.json({ success: true, merged: { from: sourceTag.name, to: targetTag.name } });
});
