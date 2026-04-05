import { Hono } from "hono";
import { db, sqlite } from "../../db";
import * as schema from "../../db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export const searchRoutes = new Hono();

// Volltextsuche über Bookmarks
searchRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;
  const query = c.req.query("q") || "";
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");
  const folderId = c.req.query("folderId");
  const tagFilter = c.req.query("tag");

  if (!query.trim()) {
    return c.json({ data: [], total: 0, query: "" });
  }

  // FTS5-Suche
  const ftsQuery = query
    .split(/\s+/)
    .map((term) => `"${term}"*`)
    .join(" OR ");

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
