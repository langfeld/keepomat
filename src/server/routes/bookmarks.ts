import { Hono } from "hono";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { createBookmarkSchema, updateBookmarkSchema } from "../../shared/validators";
import { fetchMetadata } from "../services/metadata";
import { analyzeBookmark, isAiConfigured, getEffectiveAiConfig, isAiConfiguredForUser } from "../services/ai";
import { captureScreenshot, getScreenshotPath } from "../services/screenshot";
import { validateUrlForFetch } from "../utils/url-validation";
import { existsSync } from "fs";
import { safeParseInt } from "../utils/parse";

export const bookmarkRoutes = new Hono();

// Alle Bookmarks des Users abrufen
bookmarkRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;
  const limit = safeParseInt(c.req.query("limit"), 20, 1, 100);
  const offset = safeParseInt(c.req.query("offset"), 0, 0);
  const folderId = c.req.query("folderId");
  const tagId = c.req.query("tagId");
  const isRead = c.req.query("isRead");
  const isFavorite = c.req.query("isFavorite");
  const isDeadLink = c.req.query("isDeadLink");
  const sortBy = c.req.query("sort") || "createdAt";
  const sortOrder = c.req.query("order") || "desc";

  // Sortier-Spalte bestimmen
  const sortColumn = sortBy === "title" ? schema.bookmarks.title
    : sortBy === "url" ? schema.bookmarks.url
    : sortBy === "updatedAt" ? schema.bookmarks.updatedAt
    : schema.bookmarks.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  // Filter anwenden
  const conditions = [eq(schema.bookmarks.userId, user.id)];
  if (isRead !== undefined) conditions.push(eq(schema.bookmarks.isRead, isRead === "true"));
  if (isFavorite !== undefined) conditions.push(eq(schema.bookmarks.isFavorite, isFavorite === "true"));
  if (isDeadLink !== undefined) conditions.push(eq(schema.bookmarks.isDeadLink, isDeadLink === "true"));

  const bookmarkList = db
    .select()
    .from(schema.bookmarks)
    .where(and(...conditions))
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset)
    .all();

  // Filter nach Folder
  let filteredBookmarks = bookmarkList;
  if (folderId) {
    const folderBookmarkIds = db
      .select({ bookmarkId: schema.bookmarkFolders.bookmarkId })
      .from(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.folderId, parseInt(folderId)))
      .all()
      .map((r) => r.bookmarkId);

    filteredBookmarks = bookmarkList.filter((b) => folderBookmarkIds.includes(b.id));
  }

  // Filter nach Tag
  if (tagId) {
    const tagBookmarkIds = db
      .select({ bookmarkId: schema.bookmarkTags.bookmarkId })
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.tagId, parseInt(tagId)))
      .all()
      .map((r) => r.bookmarkId);

    filteredBookmarks = filteredBookmarks.filter((b) => tagBookmarkIds.includes(b.id));
  }

  // Tags und Folders für jeden Bookmark laden
  const bookmarksWithRelations = filteredBookmarks.map((bookmark) => {
    const bookmarkTagRows = db
      .select({ tagId: schema.bookmarkTags.tagId })
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.bookmarkId, bookmark.id))
      .all();

    const tagIds = bookmarkTagRows.map((r) => r.tagId);
    const tags =
      tagIds.length > 0
        ? db
            .select()
            .from(schema.tags)
            .where(inArray(schema.tags.id, tagIds))
            .all()
        : [];

    const bookmarkFolderRows = db
      .select({ folderId: schema.bookmarkFolders.folderId })
      .from(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.bookmarkId, bookmark.id))
      .all();

    const folderIds = bookmarkFolderRows.map((r) => r.folderId);
    const folders =
      folderIds.length > 0
        ? db
            .select()
            .from(schema.folders)
            .where(inArray(schema.folders.id, folderIds))
            .all()
        : [];

    return { ...bookmark, tags, folders };
  });

  // Total count
  const total = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.id))
    .get();

  return c.json({
    data: bookmarksWithRelations,
    total: total?.count || 0,
    limit,
    offset,
    hasMore: offset + limit < (total?.count || 0),
  });
});

// Screenshot eines Bookmarks servieren
bookmarkRoutes.get("/:id/screenshot", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const bookmark = db
    .select({ screenshot: schema.bookmarks.screenshot, userId: schema.bookmarks.userId })
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!bookmark?.screenshot) {
    return c.json({ error: "Kein Screenshot vorhanden" }, 404);
  }

  const filepath = getScreenshotPath(bookmark.screenshot);
  if (!existsSync(filepath)) {
    return c.json({ error: "Screenshot-Datei nicht gefunden" }, 404);
  }

  const file = Bun.file(filepath);
  return new Response(file, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

// Screenshot neu erstellen
bookmarkRoutes.post("/:id/screenshot", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const bookmark = db
    .select({ id: schema.bookmarks.id, url: schema.bookmarks.url, userId: schema.bookmarks.userId })
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!bookmark) {
    return c.json({ error: "Bookmark nicht gefunden" }, 404);
  }

  const filename = await captureAndSaveScreenshot(bookmark.id, bookmark.url);
  if (filename) {
    return c.json({ success: true, screenshot: filename });
  }
  return c.json({ error: "Screenshot konnte nicht erstellt werden" }, 500);
});

// Einzelnen Bookmark abrufen
bookmarkRoutes.get("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const bookmark = db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!bookmark) {
    return c.json({ error: "Bookmark nicht gefunden" }, 404);
  }

  // Tags und Folders laden
  const tagRows = db
    .select({ tagId: schema.bookmarkTags.tagId })
    .from(schema.bookmarkTags)
    .where(eq(schema.bookmarkTags.bookmarkId, id))
    .all();
  const tags = tagRows.length > 0
    ? db.select().from(schema.tags).where(inArray(schema.tags.id, tagRows.map(r => r.tagId))).all()
    : [];

  const folderRows = db
    .select({ folderId: schema.bookmarkFolders.folderId })
    .from(schema.bookmarkFolders)
    .where(eq(schema.bookmarkFolders.bookmarkId, id))
    .all();
  const folders = folderRows.length > 0
    ? db.select().from(schema.folders).where(inArray(schema.folders.id, folderRows.map(r => r.folderId))).all()
    : [];

  return c.json({ ...bookmark, tags, folders });
});

// Neuen Bookmark erstellen
bookmarkRoutes.post("/", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const parsed = createBookmarkSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  // SSRF-Schutz: URL gegen interne Netzwerke validieren
  const urlError = validateUrlForFetch(data.url);
  if (urlError) {
    return c.json({ error: urlError }, 400);
  }

  // Duplikat-Check
  const existing = db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.url, data.url), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (existing) {
    return c.json(
      { error: "Bookmark existiert bereits", existingId: existing.id },
      409
    );
  }

  // Metadata abrufen
  const metadata = await fetchMetadata(data.url);

  // Bookmark erstellen
  const bookmark = db
    .insert(schema.bookmarks)
    .values({
      userId: user.id,
      url: data.url,
      title: data.title || metadata.title,
      description: data.description || metadata.description,
      ogImage: metadata.ogImage,
      favicon: metadata.favicon,
    })
    .returning()
    .get();

  // Folder-Zuweisung
  if (data.folderIds && data.folderIds.length > 0) {
    for (const folderId of data.folderIds) {
      db.insert(schema.bookmarkFolders)
        .values({ bookmarkId: bookmark.id, folderId })
        .onConflictDoNothing()
        .run();
    }
  } else if (data.folderId) {
    db.insert(schema.bookmarkFolders)
      .values({ bookmarkId: bookmark.id, folderId: data.folderId })
      .run();
  }

  // Manuelle Tags hinzufügen
  if (data.tags && data.tags.length > 0) {
    for (const tagName of data.tags) {
      const tag = db
        .insert(schema.tags)
        .values({ name: tagName.toLowerCase(), userId: user.id })
        .onConflictDoNothing()
        .returning()
        .get() ||
        db
          .select()
          .from(schema.tags)
          .where(and(eq(schema.tags.name, tagName.toLowerCase()), eq(schema.tags.userId, user.id)))
          .get();

      if (tag) {
        db.insert(schema.bookmarkTags)
          .values({ bookmarkId: bookmark.id, tagId: tag.id })
          .onConflictDoNothing()
          .run();
      }
    }
  }

  // AI-Analyse (async, nicht blockierend)
  if (!data.skipAi && isAiConfiguredForUser(user.id)) {
    analyzeAndUpdateBookmark(bookmark.id, user.id, data.url, bookmark.title, bookmark.description, data.aiCreateFolders);
  }

  // Screenshot (async, nicht blockierend)
  captureAndSaveScreenshot(bookmark.id, data.url);

  return c.json(bookmark, 201);
});

// Bookmark aktualisieren
bookmarkRoutes.patch("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = updateBookmarkSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const existing = db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: "Bookmark nicht gefunden" }, 404);
  }

  const data = parsed.data;

  // Bookmark-Felder aktualisieren
  const updateData: any = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.isRead !== undefined) updateData.isRead = data.isRead;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

  const updated = db
    .update(schema.bookmarks)
    .set(updateData)
    .where(eq(schema.bookmarks.id, id))
    .returning()
    .get();

  // Tags aktualisieren
  if (data.tags !== undefined) {
    db.delete(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.bookmarkId, id))
      .run();

    for (const tagName of data.tags) {
      const tag = db
        .insert(schema.tags)
        .values({ name: tagName.toLowerCase(), userId: user.id })
        .onConflictDoNothing()
        .returning()
        .get() ||
        db
          .select()
          .from(schema.tags)
          .where(and(eq(schema.tags.name, tagName.toLowerCase()), eq(schema.tags.userId, user.id)))
          .get();

      if (tag) {
        db.insert(schema.bookmarkTags)
          .values({ bookmarkId: id, tagId: tag.id })
          .onConflictDoNothing()
          .run();
      }
    }
  }

  // Folder aktualisieren
  if (data.folderId !== undefined || data.folderIds !== undefined) {
    db.delete(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.bookmarkId, id))
      .run();

    if (data.folderId) {
      db.insert(schema.bookmarkFolders)
        .values({ bookmarkId: id, folderId: data.folderId })
        .run();
    } else if (data.folderIds) {
      for (const folderId of data.folderIds) {
        db.insert(schema.bookmarkFolders)
          .values({ bookmarkId: id, folderId })
          .run();
      }
    }
  }

  return c.json(updated);
});

// Bookmark löschen
bookmarkRoutes.delete("/:id", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const existing = db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!existing) {
    return c.json({ error: "Bookmark nicht gefunden" }, 404);
  }

  db.delete(schema.bookmarks).where(eq(schema.bookmarks.id, id)).run();
  return c.json({ success: true });
});

// AI-Ordner für bestehendes Bookmark erstellen
bookmarkRoutes.post("/:id/ai-folder", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const bookmark = db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!bookmark) {
    return c.json({ error: "Bookmark nicht gefunden" }, 404);
  }

  if (!isAiConfiguredForUser(user.id)) {
    return c.json({ error: "AI nicht konfiguriert" }, 400);
  }

  const settings = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  const language = settings?.language || "de";

  const existingTags = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, user.id))
    .all();

  const existingFolders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .all();

  // Schnelle AI-Config ohne Thinking für interaktive Nutzung
  const aiConfig = { ...getEffectiveAiConfig(user.id), thinkingEnabled: false };

  let suggestion;
  try {
    suggestion = await analyzeBookmark(
      bookmark.url,
      bookmark.title,
      bookmark.description,
      existingTags,
      existingFolders,
      language,
      aiConfig
    );
  } catch (error) {
    console.error(`❌ AI folder analysis failed for bookmark #${id}:`, error);
    return c.json({ error: "AI-Analyse fehlgeschlagen" }, 500);
  }

  if (!suggestion) {
    return c.json({ error: "AI-Analyse lieferte kein Ergebnis" }, 422);
  }

  // Prüfen ob die AI einen existierenden Ordner vorgeschlagen hat
  let targetFolder = null;

  if (suggestion.folderId) {
    targetFolder = db
      .select()
      .from(schema.folders)
      .where(and(eq(schema.folders.id, suggestion.folderId), eq(schema.folders.userId, user.id)))
      .get() || null;
  }

  // Wenn kein existierender Ordner gefunden, neuen erstellen
  if (!targetFolder && suggestion.folderName) {
    targetFolder = db
      .insert(schema.folders)
      .values({ name: suggestion.folderName, icon: "🤖", userId: user.id })
      .returning()
      .get();
  }

  if (!targetFolder) {
    return c.json({ error: "AI konnte keinen passenden Ordner bestimmen" }, 422);
  }

  // Bookmark dem Ordner zuweisen (bestehende Zuweisungen im single-Modus entfernen)
  const folderMode = settings?.folderMode || "single";
  if (folderMode === "single") {
    db.delete(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.bookmarkId, id))
      .run();
  }

  db.insert(schema.bookmarkFolders)
    .values({ bookmarkId: id, folderId: targetFolder.id })
    .onConflictDoNothing()
    .run();

  return c.json({ folder: targetFolder });
});

// AI-Einsortierung in bestehenden Ordner (ohne neuen Ordner zu erstellen)
bookmarkRoutes.post("/:id/ai-sort", async (c) => {
  const user = c.get("user" as never) as any;
  const id = parseInt(c.req.param("id"));

  const bookmark = db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, user.id)))
    .get();

  if (!bookmark) {
    return c.json({ error: "Bookmark nicht gefunden" }, 404);
  }

  if (!isAiConfiguredForUser(user.id)) {
    return c.json({ error: "AI nicht konfiguriert" }, 400);
  }

  const settings = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  const language = settings?.language || "de";

  const existingTags = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, user.id))
    .all();

  const existingFolders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .all();

  if (existingFolders.length === 0) {
    return c.json({ error: "Keine Ordner vorhanden" }, 422);
  }

  const aiConfig = { ...getEffectiveAiConfig(user.id), thinkingEnabled: false };

  let suggestion;
  try {
    suggestion = await analyzeBookmark(
      bookmark.url,
      bookmark.title,
      bookmark.description,
      existingTags,
      existingFolders,
      language,
      aiConfig
    );
  } catch (error) {
    console.error(`\u274C AI sort analysis failed for bookmark #${id}:`, error);
    return c.json({ error: "AI-Analyse fehlgeschlagen" }, 500);
  }

  if (!suggestion) {
    return c.json({ error: "AI-Analyse lieferte kein Ergebnis" }, 422);
  }

  // Nur existierende Ordner zuweisen, keinen neuen erstellen
  let targetFolder = null;

  if (suggestion.folderId) {
    targetFolder = db
      .select()
      .from(schema.folders)
      .where(and(eq(schema.folders.id, suggestion.folderId), eq(schema.folders.userId, user.id)))
      .get() || null;
  }

  // Fallback: Ordner per Name suchen
  if (!targetFolder && suggestion.folderName) {
    targetFolder = db
      .select()
      .from(schema.folders)
      .where(and(eq(schema.folders.name, suggestion.folderName), eq(schema.folders.userId, user.id)))
      .get() || null;
  }

  if (!targetFolder) {
    return c.json({ error: "Kein passender Ordner gefunden" }, 422);
  }

  const folderMode = settings?.folderMode || "single";
  if (folderMode === "single") {
    db.delete(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.bookmarkId, id))
      .run();
  }

  db.insert(schema.bookmarkFolders)
    .values({ bookmarkId: id, folderId: targetFolder.id })
    .onConflictDoNothing()
    .run();

  return c.json({ folder: targetFolder });
});

// AI-Analyse async durchführen
async function captureAndSaveScreenshot(bookmarkId: number, url: string): Promise<string | null> {
  try {
    const filename = await captureScreenshot(url, bookmarkId);
    if (filename) {
      db.update(schema.bookmarks)
        .set({ screenshot: filename, updatedAt: new Date() })
        .where(eq(schema.bookmarks.id, bookmarkId))
        .run();
      return filename;
    }
    return null;
  } catch (error) {
    console.error(`❌ Screenshot save failed for bookmark #${bookmarkId}:`, error);
    return null;
  }
}

export async function analyzeAndUpdateBookmark(
  bookmarkId: number,
  userId: string,
  url: string,
  title: string | null,
  description: string | null,
  aiCreateFoldersOverride?: boolean
): Promise<{ folderNames: string[] }> {
  const result = { folderNames: [] as string[] };
  try {
    const existingTags = db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.userId, userId))
      .all();

    const existingFolders = db
      .select()
      .from(schema.folders)
      .where(eq(schema.folders.userId, userId))
      .all();

    // Benutzersprache für AI-Tags/Summary lesen
    const settings = db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId))
      .get();
    const language = settings?.language || "de";

    const suggestion = await analyzeBookmark(url, title, description, existingTags, existingFolders, language, getEffectiveAiConfig(userId));

    if (!suggestion) return result;

    // AI-Summary speichern
    if (suggestion.summary) {
      db.update(schema.bookmarks)
        .set({ aiSummary: suggestion.summary, updatedAt: new Date() })
        .where(eq(schema.bookmarks.id, bookmarkId))
        .run();
    }

    // Tags hinzufügen
    for (const tagName of suggestion.tags) {
      const tag = db
        .insert(schema.tags)
        .values({ name: tagName.toLowerCase(), userId })
        .onConflictDoNothing()
        .returning()
        .get() ||
        db
          .select()
          .from(schema.tags)
          .where(and(eq(schema.tags.name, tagName.toLowerCase()), eq(schema.tags.userId, userId)))
          .get();

      if (tag) {
        db.insert(schema.bookmarkTags)
          .values({ bookmarkId, tagId: tag.id })
          .onConflictDoNothing()
          .run();
      }
    }

    // Folder vorschlagen
    const folderMode = settings?.folderMode || "single";
    const aiCreateFolders = aiCreateFoldersOverride !== undefined
      ? aiCreateFoldersOverride
      : settings?.aiCreateFolders !== false; // default: true
    const hasFolder = db
      .select()
      .from(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.bookmarkId, bookmarkId))
      .get();

    // Im Single-Modus nur zuweisen wenn noch kein Ordner vorhanden
    // Im Multi-Modus immer hinzufügen (AI ergänzt Ordner)
    const shouldAssignFolder = folderMode === "multi" || !hasFolder;

    if (shouldAssignFolder && suggestion.folderId) {
      // Prüfen ob der vorgeschlagene Ordner tatsächlich existiert
      const folderExists = db
        .select({ id: schema.folders.id, name: schema.folders.name })
        .from(schema.folders)
        .where(and(eq(schema.folders.id, suggestion.folderId), eq(schema.folders.userId, userId)))
        .get();

      if (folderExists) {
        db.insert(schema.bookmarkFolders)
          .values({ bookmarkId, folderId: suggestion.folderId })
          .onConflictDoNothing()
          .run();
        result.folderNames.push(folderExists.name);
      } else if (suggestion.folderName && aiCreateFolders) {
        // AI hat eine ungültige folderId vorgeschlagen, aber einen Ordnernamen – neuen Ordner erstellen
        const newFolder = db
          .insert(schema.folders)
          .values({ name: suggestion.folderName, icon: "🤖", userId })
          .returning()
          .get();

        if (newFolder) {
          db.insert(schema.bookmarkFolders)
            .values({ bookmarkId, folderId: newFolder.id })
            .onConflictDoNothing()
            .run();
          result.folderNames.push(newFolder.name);
        }
      }
    } else if (shouldAssignFolder && suggestion.folderName && aiCreateFolders) {
      // Neuen Ordner erstellen, wenn vorgeschlagen und erlaubt
      const newFolder = db
        .insert(schema.folders)
        .values({ name: suggestion.folderName, icon: "🤖", userId })
        .returning()
        .get();

      if (newFolder) {
        db.insert(schema.bookmarkFolders)
          .values({ bookmarkId, folderId: newFolder.id })
          .onConflictDoNothing()
          .run();
        result.folderNames.push(newFolder.name);
      }
    }

    console.log(`🤖 AI analyzed bookmark #${bookmarkId}: ${suggestion.tags.length} tags, folder: ${suggestion.folderName || "none"}`);
  } catch (error) {
    console.error(`❌ AI analysis failed for bookmark #${bookmarkId}:`, error);
  }
  return result;
}
