import { Hono } from "hono";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import PDFDocument from "pdfkit";

export const exportRoutes = new Hono();

// Bookmarks als HTML exportieren (Netscape Format)
exportRoutes.get("/html", async (c) => {
  const user = c.get("user" as never) as any;

  const bookmarks = db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.id))
    .orderBy(desc(schema.bookmarks.createdAt))
    .all();

  const folders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .all();

  const bookmarkFolderMap = new Map<number, number[]>();
  const allBfLinks = db
    .select()
    .from(schema.bookmarkFolders)
    .all();

  for (const bf of allBfLinks) {
    if (!bookmarkFolderMap.has(bf.bookmarkId)) {
      bookmarkFolderMap.set(bf.bookmarkId, []);
    }
    bookmarkFolderMap.get(bf.bookmarkId)!.push(bf.folderId);
  }

  // Netscape Bookmark File Format generieren
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Keepomat Bookmarks</TITLE>
<H1>Keepomat Bookmarks</H1>
<DL><p>\n`;

  // Rekursiver Ordner-Builder
  function buildFolder(folderId: number | null, indent: string) {
    const childFolders = folders.filter((f) => f.parentId === folderId);

    for (const folder of childFolders) {
      const addDate = Math.floor(folder.createdAt.getTime() / 1000);
      html += `${indent}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${escapeHtml(folder.name)}</H3>\n`;
      html += `${indent}<DL><p>\n`;

      // Bookmarks in diesem Ordner
      const folderBookmarks = bookmarks.filter((b) => {
        const folderIds = bookmarkFolderMap.get(b.id);
        return folderIds?.includes(folder.id);
      });

      for (const bm of folderBookmarks) {
        const addDate = Math.floor(bm.createdAt.getTime() / 1000);
        html += `${indent}    <DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${addDate}"`;
        if (bm.favicon) html += ` ICON="${escapeHtml(bm.favicon)}"`;
        html += `>${escapeHtml(bm.title || bm.url)}</A>\n`;
        if (bm.description) {
          html += `${indent}    <DD>${escapeHtml(bm.description)}\n`;
        }
      }

      // Unterordner
      buildFolder(folder.id, indent + "    ");

      html += `${indent}</DL><p>\n`;
    }
  }

  // Root-Level Ordner
  buildFolder(null, "    ");

  // Bookmarks ohne Ordner
  const unfiledBookmarks = bookmarks.filter((b) => !bookmarkFolderMap.has(b.id) || bookmarkFolderMap.get(b.id)!.length === 0);
  if (unfiledBookmarks.length > 0) {
    html += `    <DT><H3>Unsortiert</H3>\n    <DL><p>\n`;
    for (const bm of unfiledBookmarks) {
      const addDate = Math.floor(bm.createdAt.getTime() / 1000);
      html += `        <DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${addDate}"`;
      if (bm.favicon) html += ` ICON="${escapeHtml(bm.favicon)}"`;
      html += `>${escapeHtml(bm.title || bm.url)}</A>\n`;
      if (bm.description) {
        html += `        <DD>${escapeHtml(bm.description)}\n`;
      }
    }
    html += `    </DL><p>\n`;
  }

  html += `</DL><p>\n`;

  c.header("Content-Type", "text/html; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="keepomat-bookmarks.html"');
  return c.body(html);
});

// Bookmarks als PDF exportieren
exportRoutes.get("/pdf", async (c) => {
  const user = c.get("user" as never) as any;

  const bookmarks = db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.id))
    .orderBy(desc(schema.bookmarks.createdAt))
    .all();

  const folders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .all();

  // PDF erstellen
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Titel
  doc.fontSize(24).font("Helvetica-Bold").text("Keepomat Bookmarks", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").fillColor("#666666")
    .text(`Exportiert am ${new Date().toLocaleDateString("de-DE")} — ${bookmarks.length} Bookmarks`, { align: "center" });
  doc.moveDown(1);
  doc.fillColor("#000000");

  // Bookmarks nach Ordner gruppieren
  const bookmarksByFolder = new Map<string, typeof bookmarks>();

  for (const bookmark of bookmarks) {
    const bfLinks = db
      .select()
      .from(schema.bookmarkFolders)
      .where(eq(schema.bookmarkFolders.bookmarkId, bookmark.id))
      .all();

    if (bfLinks.length === 0) {
      const key = "Unsortiert";
      if (!bookmarksByFolder.has(key)) bookmarksByFolder.set(key, []);
      bookmarksByFolder.get(key)!.push(bookmark);
    } else {
      for (const bf of bfLinks) {
        const folder = folders.find((f) => f.id === bf.folderId);
        const key = folder?.name || "Unbekannt";
        if (!bookmarksByFolder.has(key)) bookmarksByFolder.set(key, []);
        bookmarksByFolder.get(key)!.push(bookmark);
      }
    }
  }

  for (const [folderName, folderBookmarks] of bookmarksByFolder) {
    doc.fontSize(16).font("Helvetica-Bold").text(folderName);
    doc.moveDown(0.3);

    for (const bm of folderBookmarks) {
      doc.fontSize(11).font("Helvetica-Bold").text(bm.title || "Ohne Titel");
      doc.fontSize(9).font("Helvetica").fillColor("#0066cc").text(bm.url, { link: bm.url });
      doc.fillColor("#000000");
      if (bm.description) {
        doc.fontSize(9).font("Helvetica").fillColor("#666666").text(bm.description);
        doc.fillColor("#000000");
      }
      if (bm.aiSummary) {
        doc.fontSize(8).font("Helvetica-Oblique").fillColor("#888888").text(`AI: ${bm.aiSummary}`);
        doc.fillColor("#000000");
      }
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
  }

  doc.end();

  // Auf Fertigstellung warten
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="keepomat-bookmarks.pdf"',
    },
  });
});

// Bookmarks als JSON exportieren
exportRoutes.get("/json", async (c) => {
  const user = c.get("user" as never) as any;

  const bookmarks = db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, user.id))
    .all();

  // Tags für jeden Bookmark
  const bookmarksWithTags = bookmarks.map((bm) => {
    const tagRows = db
      .select({ tagId: schema.bookmarkTags.tagId })
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.bookmarkId, bm.id))
      .all();
    const tags = tagRows.length > 0
      ? db.select().from(schema.tags).where(inArray(schema.tags.id, tagRows.map(r => r.tagId))).all()
      : [];

    return { ...bm, tags: tags.map(t => t.name) };
  });

  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    count: bookmarks.length,
    bookmarks: bookmarksWithTags,
  };

  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", 'attachment; filename="keepomat-bookmarks.json"');
  return c.json(exportData);
});

// HTML-Import (Netscape Bookmark Format)
exportRoutes.post("/import", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();

  if (!body.html) {
    return c.json({ error: "HTML-Inhalt erforderlich" }, 400);
  }

  // Einfacher Parser für Netscape Bookmark Format
  const imported = parseNetscapeBookmarks(body.html, user.id);

  return c.json({
    success: true,
    imported: {
      bookmarks: imported.bookmarks,
      folders: imported.folders,
    },
  });
});

// Einfacher Netscape Bookmark Parser
function parseNetscapeBookmarks(html: string, userId: string) {
  let bookmarksCreated = 0;
  let foldersCreated = 0;

  const folderStack: number[] = [];
  const lines = html.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Ordner erkennen
    const folderMatch = trimmed.match(/<H3[^>]*>([^<]+)<\/H3>/i);
    if (folderMatch) {
      const folderName = decodeHtmlEntities(folderMatch[1]!);
      const parentId = folderStack.length > 0 ? folderStack[folderStack.length - 1] : null;

      const folder = db
        .insert(schema.folders)
        .values({
          name: folderName,
          parentId: parentId || null,
          userId,
          position: 0,
        })
        .returning()
        .get();

      folderStack.push(folder.id);
      foldersCreated++;
    }

    // Ordner-Ende
    if (trimmed === "</DL><p>" || trimmed === "</DL>") {
      folderStack.pop();
    }

    // Bookmark erkennen
    const bookmarkMatch = trimmed.match(/<A\s+HREF="([^"]+)"[^>]*>([^<]*)<\/A>/i);
    if (bookmarkMatch) {
      const url = bookmarkMatch[1]!;
      const title = decodeHtmlEntities(bookmarkMatch[2] || "");

      // Duplikat-Check
      const existing = db
        .select()
        .from(schema.bookmarks)
        .where(and(eq(schema.bookmarks.url, url), eq(schema.bookmarks.userId, userId)))
        .get();

      if (!existing) {
        const bookmark = db
          .insert(schema.bookmarks)
          .values({ userId, url, title: title || null })
          .returning()
          .get();

        // Ordner-Zuweisung
        if (folderStack.length > 0) {
          const currentFolderId = folderStack[folderStack.length - 1];
          if (currentFolderId) {
            db.insert(schema.bookmarkFolders)
              .values({ bookmarkId: bookmark.id, folderId: currentFolderId })
              .run();
          }
        }

        bookmarksCreated++;
      }
    }
  }

  return { bookmarks: bookmarksCreated, folders: foldersCreated };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
