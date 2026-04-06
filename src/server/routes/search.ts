import { Hono } from "hono";
import { db, sqlite } from "../../db";
import * as schema from "../../db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getEffectiveAiConfig, isAiConfiguredForUser } from "../services/ai";
import { safeParseInt } from "../utils/parse";
import OpenAI from "openai";

export const searchRoutes = new Hono();

// Volltextsuche über Bookmarks
searchRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;
  const query = c.req.query("q") || "";
  const limit = safeParseInt(c.req.query("limit"), 20, 1, 100);
  const offset = safeParseInt(c.req.query("offset"), 0, 0);
  const folderId = c.req.query("folderId");
  const tagFilter = c.req.query("tag");

  if (!query.trim()) {
    return c.json({ data: [], total: 0, query: "" });
  }

  // FTS5-Suche (Anführungszeichen escapen um FTS-Injection zu verhindern)
  const ftsQuery = query
    .split(/\s+/)
    .map((term) => `"${term.replace(/"/g, '')}"*`)
    .filter((term) => term !== '""*')
    .join(" OR ");

  if (!ftsQuery) {
    return c.json({ data: [], total: 0, query });
  }

  try {
    const ftsResults = sqlite
      .prepare(
        `SELECT rowid, rank FROM bookmarks_fts
         WHERE bookmarks_fts MATCH ?
         ORDER BY rank
         LIMIT ? OFFSET ?`
      )
      .all(ftsQuery, limit + 50, 0) as Array<{ rowid: number; rank: number }>;

    if (ftsResults.length === 0) {
      return c.json({ data: [], total: 0, query });
    }

    const bookmarkIds = ftsResults.map((r) => r.rowid);

    // Bookmarks laden (nur die des Users)
    let bookmarks = db
      .select()
      .from(schema.bookmarks)
      .where(
        and(
          eq(schema.bookmarks.userId, user.id),
          inArray(schema.bookmarks.id, bookmarkIds)
        )
      )
      .all();

    // Tag-Filter
    if (tagFilter) {
      const tag = db
        .select()
        .from(schema.tags)
        .where(and(eq(schema.tags.name, tagFilter.toLowerCase()), eq(schema.tags.userId, user.id)))
        .get();

      if (tag) {
        const taggedBookmarkIds = db
          .select({ bookmarkId: schema.bookmarkTags.bookmarkId })
          .from(schema.bookmarkTags)
          .where(eq(schema.bookmarkTags.tagId, tag.id))
          .all()
          .map((r) => r.bookmarkId);

        bookmarks = bookmarks.filter((b) => taggedBookmarkIds.includes(b.id));
      }
    }

    // Folder-Filter
    if (folderId) {
      const folderBookmarkIds = db
        .select({ bookmarkId: schema.bookmarkFolders.bookmarkId })
        .from(schema.bookmarkFolders)
        .where(eq(schema.bookmarkFolders.folderId, parseInt(folderId)))
        .all()
        .map((r) => r.bookmarkId);

      bookmarks = bookmarks.filter((b) => folderBookmarkIds.includes(b.id));
    }

    // Ranking beibehalten
    const rankMap = new Map(ftsResults.map((r) => [r.rowid, r.rank]));
    bookmarks.sort((a, b) => (rankMap.get(a.id) || 0) - (rankMap.get(b.id) || 0));

    // Pagination
    const total = bookmarks.length;
    const paginatedBookmarks = bookmarks.slice(offset, offset + limit);

    // Tags und Folders laden
    const bookmarksWithRelations = paginatedBookmarks.map((bookmark) => {
      const tagRows = db
        .select({ tagId: schema.bookmarkTags.tagId })
        .from(schema.bookmarkTags)
        .where(eq(schema.bookmarkTags.bookmarkId, bookmark.id))
        .all();
      const tags = tagRows.length > 0
        ? db.select().from(schema.tags).where(inArray(schema.tags.id, tagRows.map(r => r.tagId))).all()
        : [];

      const folderRows = db
        .select({ folderId: schema.bookmarkFolders.folderId })
        .from(schema.bookmarkFolders)
        .where(eq(schema.bookmarkFolders.bookmarkId, bookmark.id))
        .all();
      const folders = folderRows.length > 0
        ? db.select().from(schema.folders).where(inArray(schema.folders.id, folderRows.map(r => r.folderId))).all()
        : [];

      return { ...bookmark, tags, folders };
    });

    return c.json({
      data: bookmarksWithRelations,
      total,
      query,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Search error:", error);
    // Fallback: LIKE-Suche
    const likeQuery = `%${query}%`;
    const bookmarks = db
      .select()
      .from(schema.bookmarks)
      .where(
        and(
          eq(schema.bookmarks.userId, user.id),
          sql`(${schema.bookmarks.title} LIKE ${likeQuery} OR ${schema.bookmarks.url} LIKE ${likeQuery} OR ${schema.bookmarks.description} LIKE ${likeQuery})`
        )
      )
      .limit(limit)
      .offset(offset)
      .all();

    return c.json({ data: bookmarks, total: bookmarks.length, query });
  }
});

// AI-Suche – semantische Suche über Bookmarks via AI
searchRoutes.post("/ai", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const query = body.q || "";

  if (!query.trim()) {
    return c.json({ data: [], total: 0, query: "" });
  }

  // Prüfe ob AI verfügbar ist
  if (!isAiConfiguredForUser(user.id)) {
    return c.json({ error: "Keine AI-Konfiguration vorhanden" }, 400);
  }

  // Alle Bookmarks des Users laden (Titel, URL, Beschreibung, AI-Summary)
  const allBookmarks = db
    .select({
      id: schema.bookmarks.id,
      url: schema.bookmarks.url,
      title: schema.bookmarks.title,
      description: schema.bookmarks.description,
      aiSummary: schema.bookmarks.aiSummary,
    })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.id))
    .all();

  if (allBookmarks.length === 0) {
    return c.json({ data: [], total: 0, query });
  }

  // Bookmark-Liste für die AI vorbereiten (max. 200 für Token-Limit)
  const bookmarkData = allBookmarks.slice(0, 200).map((b) =>
    `[ID:${b.id}] ${b.title || "Kein Titel"} | ${b.url} | ${b.description || ""} | ${b.aiSummary || ""}`
  ).join("\n");

  const config = getEffectiveAiConfig(user.id);
  const client = new OpenAI({
    apiKey: config.apiKey || "ollama",
    baseURL: config.baseURL,
  });

  try {
    const params: Record<string, any> = {
      model: config.model,
      messages: [
        {
          role: "system",
          content: "Du bist ein Such-Assistent für Lesezeichen. Der Benutzer sucht nach passenden Lesezeichen. Analysiere die Suchanfrage semantisch und finde die am besten passenden Lesezeichen. Antworte NUR mit validem JSON.",
        },
        {
          role: "user",
          content: `Suchanfrage: "${query}"

Hier sind alle verfügbaren Lesezeichen:
${bookmarkData}

Finde die Lesezeichen, die am besten zur Suchanfrage passen. Berücksichtige dabei nicht nur exakte Wortübereinstimmungen, sondern auch:
- Thematische Ähnlichkeit
- Synonyme und verwandte Begriffe
- Kontext und Bedeutung

Antworte mit folgendem JSON-Format:
{
  "ids": [1, 2, 3],
  "reason": "Kurze Erklärung warum diese Ergebnisse passen"
}

Gib nur IDs zurück, die wirklich relevant sind (maximal 10). Wenn nichts passt, gib ein leeres Array zurück.`,
        },
      ],
      response_format: { type: "json_object" },
    };

    if (config.provider === "kimi") {
      params.thinking = { type: "disabled" };
    } else {
      params.temperature = 0.3;
    }

    const completion = await client.chat.completions.create(params as any);
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return c.json({ data: [], total: 0, query });
    }

    const result = JSON.parse(content);
    const matchedIds: number[] = Array.isArray(result.ids) ? result.ids : [];

    if (matchedIds.length === 0) {
      return c.json({ data: [], total: 0, query, aiReason: result.reason || "" });
    }

    // Vollständige Bookmarks laden
    const matchedBookmarks = db
      .select()
      .from(schema.bookmarks)
      .where(
        and(
          eq(schema.bookmarks.userId, user.id),
          inArray(schema.bookmarks.id, matchedIds)
        )
      )
      .all();

    // Tags und Folders laden
    const bookmarksWithRelations = matchedBookmarks.map((bookmark) => {
      const tagRows = db
        .select({ tagId: schema.bookmarkTags.tagId })
        .from(schema.bookmarkTags)
        .where(eq(schema.bookmarkTags.bookmarkId, bookmark.id))
        .all();
      const tags = tagRows.length > 0
        ? db.select().from(schema.tags).where(inArray(schema.tags.id, tagRows.map(r => r.tagId))).all()
        : [];

      const folderRows = db
        .select({ folderId: schema.bookmarkFolders.folderId })
        .from(schema.bookmarkFolders)
        .where(eq(schema.bookmarkFolders.bookmarkId, bookmark.id))
        .all();
      const folders = folderRows.length > 0
        ? db.select().from(schema.folders).where(inArray(schema.folders.id, folderRows.map(r => r.folderId))).all()
        : [];

      return { ...bookmark, tags, folders };
    });

    // Reihenfolge der AI-Empfehlung beibehalten
    const orderedBookmarks = matchedIds
      .map((id) => bookmarksWithRelations.find((b) => b.id === id))
      .filter(Boolean);

    return c.json({
      data: orderedBookmarks,
      total: orderedBookmarks.length,
      query,
      aiReason: result.reason || "",
    });
  } catch (error) {
    console.error("AI-Suche fehlgeschlagen:", error);
    return c.json({ error: "AI-Suche fehlgeschlagen" }, 500);
  }
});
