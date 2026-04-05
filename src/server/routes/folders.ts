import { Hono } from "hono";
import { db, sqlite } from "../../db";
import * as schema from "../../db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { createFolderSchema, updateFolderSchema, shareFolderSchema } from "../../shared/validators";
import type { FolderTree } from "../../shared/types";

export const folderRoutes = new Hono();

// Ordner-Baum abrufen (inklusive aller Unterordner)
folderRoutes.get("/tree", async (c) => {
  const user = c.get("user" as never) as any;

  const allFolders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .orderBy(asc(schema.folders.position), asc(schema.folders.name))
    .all();

  // Geteilte Ordner laden
  const sharedFolderEntries = db
    .select()
    .from(schema.sharedFolders)
    .where(eq(schema.sharedFolders.userId, user.id))
    .all();

  const sharedFolderData = sharedFolderEntries.map((sf) => {
    const folder = db
      .select()
      .from(schema.folders)
      .where(eq(schema.folders.id, sf.folderId))
      .get();
    return { ...folder, shared: true, permission: sf.permission };
  }).filter(Boolean);

  // Rekursiven Baum aufbauen
  function buildTree(parentId: number | null): FolderTree[] {
    return allFolders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        ...f,
        children: buildTree(f.id),
      }));
  }

  const tree = buildTree(null);

  return c.json({ tree, shared: sharedFolderData });
});

// Alle Ordner flach abrufen
folderRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;

  const folders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .orderBy(asc(schema.folders.position), asc(schema.folders.name))
    .all();

  return c.json(folders);
});

// Einzelnen Ordner abrufen
folderRoutes.get("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const folder = db
    .select()
    .from(schema.folders)
    .where(and(eq(schema.folders.id, id), eq(schema.folders.userId, user.id)))
    .get();

  if (!folder) {
    return c.json({ error: "Ordner nicht gefunden" }, 404);
  }

  // Unterordner laden
  const children = db
    .select()
    .from(schema.folders)
    .where(and(eq(schema.folders.parentId, id), eq(schema.folders.userId, user.id)))
    .orderBy(asc(schema.folders.position))
    .all();

  return c.json({ ...folder, children });
});

// Neuen Ordner erstellen
folderRoutes.post("/", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const parsed = createFolderSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  // Prüfe ob Parent-Folder existiert (wenn angegeben)
  if (data.parentId) {
    const parent = db
      .select()
      .from(schema.folders)
      .where(and(eq(schema.folders.id, data.parentId), eq(schema.folders.userId, user.id)))
      .get();

    if (!parent) {
      return c.json({ error: "Übergeordneter Ordner nicht gefunden" }, 404);
    }
  }

  // Position ermitteln (letzter im Parent)
  const siblings = db
    .select()
    .from(schema.folders)
    .where(
      and(
        eq(schema.folders.userId, user.id),
        data.parentId
          ? eq(schema.folders.parentId, data.parentId)
          : isNull(schema.folders.parentId)
      )
    )
    .all();

  const position = siblings.length;

  const folder = db
    .insert(schema.folders)
    .values({
      name: data.name,
      parentId: data.parentId || null,
      icon: data.icon || null,
      color: data.color || null,
      userId: user.id,
      position,
    })
    .returning()
    .get();

  return c.json(folder, 201);
});

// Ordner aktualisieren
folderRoutes.patch("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateFolderSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const existing = db
    .select()
    .from(schema.folders)
    .where(and(eq(schema.folders.id, id), eq(schema.folders.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: "Ordner nicht gefunden" }, 404);
  }

  const data = parsed.data;

  // Prüfe auf zirkuläre Referenz beim Verschieben
  if (data.parentId !== undefined && data.parentId !== null) {
    if (data.parentId === id) {
      return c.json({ error: "Ordner kann nicht sich selbst untergeordnet werden" }, 400);
    }

    // Rekursiv prüfen ob der neue Parent ein Kind des aktuellen Ordners ist
    const isDescendant = checkIsDescendant(id, data.parentId, user.id);
    if (isDescendant) {
      return c.json({ error: "Zirkuläre Ordnerstruktur nicht erlaubt" }, 400);
    }
  }

  const updateData: any = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.parentId !== undefined) updateData.parentId = data.parentId;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.position !== undefined) updateData.position = data.position;

  const updated = db
    .update(schema.folders)
    .set(updateData)
    .where(eq(schema.folders.id, id))
    .returning()
    .get();

  return c.json(updated);
});

// Ordner löschen (kaskadiert durch FK constraint)
folderRoutes.delete("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const existing = db
    .select()
    .from(schema.folders)
    .where(and(eq(schema.folders.id, id), eq(schema.folders.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: "Ordner nicht gefunden" }, 404);
  }

  db.delete(schema.folders).where(eq(schema.folders.id, id)).run();
  return c.json({ success: true });
});

// Ordner teilen
folderRoutes.post("/:id/share", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = shareFolderSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const folder = db
    .select()
    .from(schema.folders)
    .where(and(eq(schema.folders.id, id), eq(schema.folders.userId, user.id)))
    .get();

  if (!folder) {
    return c.json({ error: "Ordner nicht gefunden" }, 404);
  }

  // Prüfe ob Zieluser existiert
  const targetUser = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, parsed.data.userId))
    .get();

  if (!targetUser) {
    return c.json({ error: "Benutzer nicht gefunden" }, 404);
  }

  const shared = db
    .insert(schema.sharedFolders)
    .values({
      folderId: id,
      userId: parsed.data.userId,
      permission: parsed.data.permission,
    })
    .returning()
    .get();

  return c.json(shared, 201);
});

// Prüfe ob targetId ein Nachkomme von folderId ist
function checkIsDescendant(folderId: number, targetId: number, userId: string): boolean {
  const children = db
    .select()
    .from(schema.folders)
    .where(and(eq(schema.folders.parentId, folderId), eq(schema.folders.userId, userId)))
    .all();

  for (const child of children) {
    if (child.id === targetId) return true;
    if (checkIsDescendant(child.id, targetId, userId)) return true;
  }
  return false;
}
