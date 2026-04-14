import { Bot } from "grammy";
import { db } from "../db";
import { userSettings, bookmarks, tags, folders } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { fetchMetadata } from "../server/services/metadata";
import { analyzeBookmark } from "../server/services/ai";

// ── Multi-Bot-Manager: Pro User ein eigener Bot ──

const activeBots = new Map<string, Bot>(); // userId → Bot-Instanz

/**
 * Startet den Bot für einen bestimmten User.
 * Falls bereits ein Bot läuft, wird er zuerst gestoppt.
 */
export async function startBotForUser(userId: string, token: string): Promise<{ success: boolean; botUsername?: string; error?: string }> {
  // Alten Bot stoppen falls vorhanden
  await stopBotForUser(userId);

  try {
    const bot = new Bot(token);

    // Bot-Info abrufen (validiert auch den Token)
    const botInfo = await bot.api.getMe();

    // /start – Begrüßung + Auto-Link
    bot.command("start", async (ctx) => {
      const chatId = ctx.chat.id.toString();

      // Chat-ID für diesen User speichern
      db.update(userSettings)
        .set({ telegramChatId: chatId })
        .where(eq(userSettings.userId, userId))
        .run();

      await ctx.reply(
        `✅ Willkommen bei Keepomat!\n\n` +
        `Dein Account ist jetzt verknüpft. Schicke mir einfach einen Link, um ihn als Lesezeichen zu speichern! 🔖`,
        { parse_mode: "HTML" }
      );
    });

    // /recent – Letzte Lesezeichen
    bot.command("recent", async (ctx) => {
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
      const query = ctx.match;
      if (!query) {
        await ctx.reply("🔍 Gib einen Suchbegriff an: /search <Begriff>");
        return;
      }

      const results = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .limit(50);

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
        `/start – Bot aktivieren\n` +
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

      // Chat-ID aktualisieren (falls noch nicht gesetzt)
      const chatId = ctx.chat.id.toString();
      db.update(userSettings)
        .set({ telegramChatId: chatId })
        .where(eq(userSettings.userId, userId))
        .run();

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

    // Bot starten (Long Polling) – mit Error-Handler für 409 Conflict
    bot.catch((err) => {
      const e = err.error;
      // 409 = gleicher Token wird von einer anderen Instanz gepollt (z.B. Production)
      if (e && typeof e === "object" && "error_code" in e && (e as any).error_code === 409) {
        console.warn(`⚠️  Telegram-Bot für User ${userId}: Token wird bereits von einer anderen Instanz verwendet – Bot wird übersprungen.`);
        stopBotForUser(userId);
        return;
      }
      console.error(`❌ Telegram-Bot-Fehler für User ${userId}:`, e);
    });

    bot.start({
      onStart: () => console.log(`🤖 Telegram-Bot gestartet für User ${userId} (@${botInfo.username})`),
    }).catch((err: any) => {
      // 409 Conflict: Token wird von einer anderen Bot-Instanz gepollt
      if (err?.error_code === 409 || err?.message?.includes("409") || err?.message?.includes("Conflict")) {
        console.warn(`⚠️  Telegram-Bot für User ${userId}: Konflikt – eine andere Instanz nutzt diesen Token bereits. Bot wird deaktiviert.`);
      } else {
        console.error(`❌ Telegram-Bot für User ${userId} unerwartet gestoppt:`, err?.message || err);
      }
      activeBots.delete(userId);
    });

    activeBots.set(userId, bot);

    return { success: true, botUsername: botInfo.username };
  } catch (err: any) {
    console.error(`❌ Bot-Start für User ${userId} fehlgeschlagen:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Stoppt den Bot für einen bestimmten User.
 */
export async function stopBotForUser(userId: string) {
  const bot = activeBots.get(userId);
  if (bot) {
    try {
      bot.stop();
    } catch {}
    activeBots.delete(userId);
    console.log(`🤖 Telegram-Bot gestoppt für User ${userId}`);
  }
}

/**
 * Startet Bots für alle User, die einen Token konfiguriert haben.
 * Wird beim Server-Start aufgerufen.
 */
export async function startAllUserBots() {
  const usersWithBots = db
    .select({
      userId: userSettings.userId,
      telegramBotToken: userSettings.telegramBotToken,
    })
    .from(userSettings)
    .all()
    .filter((u) => u.telegramBotToken);

  if (usersWithBots.length === 0) {
    console.log("ℹ️  Keine User mit Telegram-Bot-Token gefunden");
    return;
  }

  console.log(`🤖 Starte ${usersWithBots.length} Telegram-Bot(s)...`);

  for (const user of usersWithBots) {
    try {
      await startBotForUser(user.userId, user.telegramBotToken!);
    } catch (err: any) {
      console.warn(`⚠️  Bot-Start für User ${user.userId} übersprungen: ${err?.message || err}`);
    }
  }
}

/**
 * Prüft ob ein Bot-Token gültig ist, ohne den Bot zu starten.
 */
export async function validateBotToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const bot = new Bot(token);
    const info = await bot.api.getMe();
    return { valid: true, username: info.username };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

/**
 * Gibt zurück ob ein User einen aktiven Bot hat.
 */
export function isBotActive(userId: string): boolean {
  return activeBots.has(userId);
}

/**
 * Stoppt alle laufenden Bots (für Graceful Shutdown).
 */
export function stopAllBots() {
  for (const [userId, bot] of activeBots) {
    try {
      bot.stop();
    } catch {}
  }
  activeBots.clear();
}

// ── Hilfsfunktionen ──

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
