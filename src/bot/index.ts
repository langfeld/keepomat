import { Bot, Context } from "grammy";
import { db } from "../db";
import { telegramLinks, bookmarks, bookmarkFolders, users, tags, folders } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { fetchMetadata } from "../server/services/metadata";
import { analyzeBookmark } from "../server/services/ai";

let bot: Bot | null = null;

export async function startBot(tokenOverride?: string) {
  const token = tokenOverride || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("⚠️  TELEGRAM_BOT_TOKEN nicht gesetzt – Bot wird übersprungen");
    return;
  }

  bot = new Bot(token);

  // /start – Verknüpfung starten
  bot.command("start", async (ctx) => {
    const chatId = ctx.chat.id.toString();

    // Prüfen ob bereits verknüpft
    const existing = await db
      .select()
      .from(telegramLinks)
      .where(eq(telegramLinks.telegramChatId, chatId))
      .limit(1);

    if (existing.length > 0) {
      await ctx.reply(
        "✅ Dein Account ist bereits verknüpft! Schicke mir einfach einen Link, um ihn als Lesezeichen zu speichern."
      );
      return;
    }

    // Verknüpfungscode generieren
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();

    await db.insert(telegramLinks).values({
      userId: "", // Wird beim Verknüpfen gesetzt
      telegramChatId: chatId,
      telegramUsername: ctx.from?.username || null,
      isActive: false,
    });

    await ctx.reply(
      `🔗 Willkommen bei Keepomat!\n\n` +
      `Dein Verknüpfungscode: <code>${code}</code>\n\n` +
      `Gib diesen Code in den Keepomat-Einstellungen unter „Telegram" ein, um deinen Account zu verknüpfen.\n\n` +
      `Danach kannst du mir einfach Links schicken, und ich speichere sie automatisch als Lesezeichen!`,
      { parse_mode: "HTML" }
    );
  });

  // /recent – Letzte Lesezeichen
  bot.command("recent", async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      await ctx.reply("❌ Dein Account ist noch nicht verknüpft. Nutze /start um zu beginnen.");
      return;
    }

    const recent = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(bookmarks.createdAt)
      .limit(5);

    if (recent.length === 0) {
      await ctx.reply("📭 Du hast noch keine Lesezeichen.");
      return;
    }

    const lines = recent.map(
      (b, i) => `${i + 1}. <a href="${escapeHtml(b.url)}">${escapeHtml(b.title || b.url)}</a>`
    );

    await ctx.reply(
      `📚 Deine letzten Lesezeichen:\n\n${lines.join("\n")}`,
      { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
    );
  });

  // /search [query] – Suche
  bot.command("search", async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      await ctx.reply("❌ Dein Account ist noch nicht verknüpft.");
      return;
    }

    const query = ctx.match;
    if (!query) {
      await ctx.reply("🔍 Gib einen Suchbegriff an: /search <Begriff>");
      return;
    }

    const results = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .limit(10);

    // Einfache Textsuche
    const filtered = results.filter(
      (b) =>
        b.title?.toLowerCase().includes(query.toLowerCase()) ||
        b.url.toLowerCase().includes(query.toLowerCase()) ||
        b.description?.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
      await ctx.reply(`🔍 Keine Ergebnisse für „${escapeHtml(query)}".`);
      return;
    }

    const lines = filtered.slice(0, 5).map(
      (b, i) => `${i + 1}. <a href="${escapeHtml(b.url)}">${escapeHtml(b.title || b.url)}</a>`
    );

    await ctx.reply(
      `🔍 Ergebnisse für „${escapeHtml(query)}":\n\n${lines.join("\n")}`,
      { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
    );
  });

  // /help – Hilfe
  bot.command("help", async (ctx) => {
    await ctx.reply(
      `🤖 <b>Keepomat Bot – Befehle</b>\n\n` +
      `/start – Account verknüpfen\n` +
      `/recent – Letzte 5 Lesezeichen\n` +
      `/search &lt;Begriff&gt; – Lesezeichen suchen\n` +
      `/help – Diese Hilfe\n\n` +
      `Schicke mir einfach einen Link, um ihn als Lesezeichen zu speichern!`,
      { parse_mode: "HTML" }
    );
  });

  // URL-Erkennung – Links automatisch speichern
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const urls = extractUrls(text);

    if (urls.length === 0) return;

    const userId = await getUserId(ctx);
    if (!userId) {
      await ctx.reply("❌ Bitte verknüpfe zuerst deinen Account mit /start");
      return;
    }

    for (const url of urls) {
      try {
        // Duplikat-Prüfung
        const existing = await db
          .select()
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, userId), eq(bookmarks.url, url)))
          .limit(1);

        if (existing.length > 0) {
          await ctx.reply(`⚠️ Bereits gespeichert: ${url}`);
          continue;
        }

        // Metadaten holen
        const metadata = await fetchMetadata(url);

        const [inserted] = await db.insert(bookmarks).values({
          userId,
          url,
          title: metadata.title || url,
          description: metadata.description || null,
          ogImage: metadata.ogImage || null,
          favicon: metadata.favicon || null,
        }).returning({ id: bookmarks.id });

        await ctx.reply(
          `✅ Gespeichert: <a href="${escapeHtml(url)}">${escapeHtml(metadata.title || url)}</a>`,
          { parse_mode: "HTML", link_preview_options: { is_disabled: true } }
        );

        // AI-Analyse im Hintergrund
        analyzeBookmarkAsync(inserted!.id, url, metadata.title || "", metadata.description || "", userId);
      } catch (err) {
        console.error("Telegram Bookmark-Fehler:", err);
        await ctx.reply(`❌ Fehler beim Speichern von ${url}`);
      }
    }
  });

  // Bot starten (Long Polling)
  bot.start({
    onStart: () => console.log("🤖 Telegram-Bot gestartet"),
  });
}

export function stopBot() {
  bot?.stop();
}

// Hilfsfunktionen

async function getUserId(ctx: Context): Promise<string | null> {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return null;

  const link = await db
    .select()
    .from(telegramLinks)
    .where(and(eq(telegramLinks.telegramChatId, chatId), eq(telegramLinks.isActive, true)))
    .limit(1);

  return link[0]?.userId || null;
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  return [...text.matchAll(urlRegex)].map((m) => m[0]);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function analyzeBookmarkAsync(
  bookmarkId: number,
  url: string,
  title: string,
  description: string,
  userId: string
) {
  try {
    // Existierende Tags und Ordner des Users für AI-Kontext laden
    const existingTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId));

    const existingFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId));

    const result = await analyzeBookmark(url, title, description, existingTags, existingFolders);
    if (result) {
      await db
        .update(bookmarks)
        .set({
          aiSummary: result.summary,
          updatedAt: new Date(),
        })
        .where(eq(bookmarks.id, bookmarkId));
    }
  } catch (err) {
    console.error("AI-Analyse (Telegram) fehlgeschlagen:", err);
  }
}
