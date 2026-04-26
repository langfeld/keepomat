import { Hono } from "hono";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import { updateSettingsSchema } from "../../shared/validators";
import { getUserAiConfig, testAiConnection, getDefaultModelForProvider, type AiConfig } from "../services/ai";
import { startBotForUser, stopBotForUser, validateBotToken, isBotActive } from "../../bot";

export const settingsRoutes = new Hono();

// API-Key maskieren (nur letzte 4 Zeichen zeigen)
function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 4) return "****";
  return "****" + key.slice(-4);
}

// AI-Provider Key-Spalten-Mapping
const aiKeyColumns: Record<string, string> = {
  openai: "openaiApiKey",
  anthropic: "anthropicApiKey",
  groq: "groqApiKey",
  mistral: "mistralApiKey",
  kimi: "kimiApiKey",
  deepseek: "deepseekApiKey",
};

// Alle AI-Keys eines User-Settings-Objekts maskieren
function maskAllAiKeys(settings: any): any {
  const result = { ...settings };
  for (const col of Object.values(aiKeyColumns)) {
    if (result[col]) result[col] = maskApiKey(result[col]);
  }
  if (result.aiApiKey) result.aiApiKey = maskApiKey(result.aiApiKey);
  return result;
}

// Einstellungen abrufen
settingsRoutes.get("/", async (c) => {
  const user = c.get("user" as never) as any;

  let settings = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  // Settings erstellen falls nicht vorhanden
  if (!settings) {
    settings = db
      .insert(schema.userSettings)
      .values({ userId: user.id })
      .returning()
      .get();
  }

  // API-Key maskiert zurückgeben
  return c.json({
    ...maskAllAiKeys(settings),
    telegramBotToken: maskApiKey(settings.telegramBotToken),
    telegramActive: isBotActive(user.id),
  });
});

// Einstellungen aktualisieren
settingsRoutes.patch("/", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const updateData: any = {};
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.folderMode !== undefined) updateData.folderMode = data.folderMode;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.defaultFolderId !== undefined) updateData.defaultFolderId = data.defaultFolderId;
  // AI-Einstellungen
  if (data.aiProvider !== undefined) updateData.aiProvider = data.aiProvider;
  if (data.aiApiKey !== undefined) updateData.aiApiKey = data.aiApiKey;
  if (data.aiModel !== undefined) updateData.aiModel = data.aiModel;
  if (data.aiBaseUrl !== undefined) updateData.aiBaseUrl = data.aiBaseUrl;
  // Per-Provider API-Key speichern (aus aiApiKey gemappt)
  if (data.aiApiKey !== undefined && typeof data.aiProvider === "string" && aiKeyColumns[data.aiProvider]) {
    updateData[aiKeyColumns[data.aiProvider]] = data.aiApiKey;
  }
  if (data.showAiSummary !== undefined) updateData.showAiSummary = data.showAiSummary;
  if (data.aiCreateFolders !== undefined) updateData.aiCreateFolders = data.aiCreateFolders;
  // Telegram Bot Token
  if (data.telegramBotToken !== undefined) updateData.telegramBotToken = data.telegramBotToken;

  // Upsert
  const existing = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  let settings;
  if (existing) {
    settings = db
      .update(schema.userSettings)
      .set(updateData)
      .where(eq(schema.userSettings.userId, user.id))
      .returning()
      .get();
  } else {
    settings = db
      .insert(schema.userSettings)
      .values({ userId: user.id, ...updateData })
      .returning()
      .get();
  }

  return c.json({
    ...maskAllAiKeys(settings),
    telegramBotToken: maskApiKey(settings.telegramBotToken),
    telegramActive: isBotActive(user.id),
  });
});

// Telegram-Bot Token speichern und Bot starten
settingsRoutes.post("/telegram/connect", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();
  const token = body.token?.trim();

  if (!token) {
    return c.json({ error: "Kein Token angegeben" }, 400);
  }

  // Token validieren
  const validation = await validateBotToken(token);
  if (!validation.valid) {
    return c.json({ error: `Ungültiges Token: ${validation.error}` }, 400);
  }

  // Token speichern
  const existing = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  if (existing) {
    db.update(schema.userSettings)
      .set({ telegramBotToken: token })
      .where(eq(schema.userSettings.userId, user.id))
      .run();
  } else {
    db.insert(schema.userSettings)
      .values({ userId: user.id, telegramBotToken: token })
      .run();
  }

  // Bot starten
  const result = await startBotForUser(user.id, token);

  return c.json({
    success: result.success,
    botUsername: result.botUsername || validation.username,
    error: result.error,
  });
});

// Telegram-Bot trennen und stoppen
settingsRoutes.post("/telegram/disconnect", async (c) => {
  const user = c.get("user" as never) as any;

  // Bot stoppen
  await stopBotForUser(user.id);

  // Token und Chat-ID löschen
  db.update(schema.userSettings)
    .set({ telegramBotToken: null, telegramChatId: null })
    .where(eq(schema.userSettings.userId, user.id))
    .run();

  return c.json({ success: true });
});

// Telegram-Bot Status prüfen
settingsRoutes.get("/telegram/status", async (c) => {
  const user = c.get("user" as never) as any;

  const settings = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  return c.json({
    hasToken: !!settings?.telegramBotToken,
    isActive: isBotActive(user.id),
    chatId: settings?.telegramChatId || null,
  });
});
settingsRoutes.post("/ai/test", async (c) => {
  const user = c.get("user" as never) as any;

  const userConfig = getUserAiConfig(user.id);
  if (!userConfig) {
    return c.json({ success: false, message: "Keine eigene AI-Konfiguration vorhanden", duration: 0 });
  }

  const result = await testAiConnection(userConfig);
  return c.json(result);
});

// Einstellungen als JSON exportieren
settingsRoutes.get("/export", async (c) => {
  const user = c.get("user" as never) as any;

  const settings = db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();

  const folders = db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.userId, user.id))
    .all();

  const tags = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, user.id))
    .all();

  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    settings,
    folders: folders.map((f) => ({
      name: f.name,
      icon: f.icon,
      color: f.color,
      parentId: f.parentId,
      position: f.position,
    })),
    tags: tags.map((t) => ({
      name: t.name,
      color: t.color,
    })),
  };

  return c.json(exportData);
});

// Einstellungen aus JSON importieren
settingsRoutes.post("/import", async (c) => {
  const user = c.get("user" as never) as any;
  const body = await c.req.json();

  if (!body.version || !body.settings) {
    return c.json({ error: "Ungültiges Import-Format" }, 400);
  }

  // Settings importieren
  if (body.settings) {
    const updateData: any = {};
    if (body.settings.theme) updateData.theme = body.settings.theme;
    if (body.settings.folderMode) updateData.folderMode = body.settings.folderMode;
    if (body.settings.language) updateData.language = body.settings.language;

    db.update(schema.userSettings)
      .set(updateData)
      .where(eq(schema.userSettings.userId, user.id))
      .run();
  }

  // Tags importieren (ohne Duplikate)
  let tagsImported = 0;
  if (body.tags && Array.isArray(body.tags)) {
    for (const tag of body.tags) {
      db.insert(schema.tags)
        .values({ name: tag.name.toLowerCase(), color: tag.color || null, userId: user.id })
        .onConflictDoNothing()
        .run();
      tagsImported++;
    }
  }

  // Ordner importieren (Reihenfolge beibehalten)
  let foldersImported = 0;
  if (body.folders && Array.isArray(body.folders)) {
    // Erst Root-Ordner, dann Unterordner
    const idMap = new Map<number, number>(); // alte ID → neue ID

    // Root-Ordner zuerst
    for (const folder of body.folders.filter((f: any) => !f.parentId)) {
      const created = db
        .insert(schema.folders)
        .values({
          name: folder.name,
          icon: folder.icon || null,
          color: folder.color || null,
          parentId: null,
          userId: user.id,
          position: folder.position || 0,
        })
        .returning()
        .get();
      if (folder.id) idMap.set(folder.id, created.id);
      foldersImported++;
    }

    // Unterordner
    for (const folder of body.folders.filter((f: any) => f.parentId)) {
      const newParentId = idMap.get(folder.parentId);
      if (newParentId) {
        const created = db
          .insert(schema.folders)
          .values({
            name: folder.name,
            icon: folder.icon || null,
            color: folder.color || null,
            parentId: newParentId,
            userId: user.id,
            position: folder.position || 0,
          })
          .returning()
          .get();
        if (folder.id) idMap.set(folder.id, created.id);
        foldersImported++;
      }
    }
  }

  return c.json({
    success: true,
    imported: { tags: tagsImported, folders: foldersImported },
  });
});
