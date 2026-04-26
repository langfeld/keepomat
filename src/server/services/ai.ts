import OpenAI from "openai";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import type { AiSuggestion, Folder, Tag } from "../../shared/types";

// AI-Konfiguration (provider, model, apiKey, baseURL)
export interface AiConfig {
  provider: string;
  model: string;
  apiKey: string | undefined;
  baseURL: string;
  thinkingEnabled: boolean;
}

// System-Setting lesen (aus DB oder env)
function getSystemSetting(key: string): string | undefined {
  try {
    const result = db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, key))
      .get();
    return result?.value || undefined;
  } catch {
    return undefined;
  }
}

// BaseURL für Provider bestimmen
function getBaseURLForProvider(provider: string, customBaseUrl?: string | null): string {
  if (customBaseUrl) return customBaseUrl;
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com/v1";
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "mistral":
      return "https://api.mistral.ai/v1";
    case "ollama":
      return getSystemSetting("ollama_url") || process.env.OLLAMA_URL || "http://localhost:11434/v1";
    case "deepseek":
      return "https://api.deepseek.com";
    case "kimi":
    default:
      return "https://api.moonshot.ai/v1";
  }
}

// System-weite AI-Konfiguration (Admin-Settings)
function getSystemAiConfig(): AiConfig {
  const provider = getSystemSetting("ai_provider") || process.env.AI_PROVIDER || "kimi";
  const model = getSystemSetting("ai_model") || process.env.AI_MODEL || "kimi-k2-turbo-preview";
  const apiKey = getSystemApiKey(provider);
  const thinkingEnabled = (getSystemSetting("ai_thinking_enabled") || process.env.AI_THINKING_ENABLED || "false") === "true";
  const baseURL = getBaseURLForProvider(provider);

  return { provider, model, apiKey, baseURL, thinkingEnabled };
}

// System API-Key für Provider lesen (per-Provider + Legacy-Fallback)
function getSystemApiKey(provider: string): string | undefined {
  const key = getSystemSetting(`${provider}_api_key`) || process.env[`${provider.toUpperCase()}_API_KEY`];
  if (key) return key;
  if (provider === "kimi") return getSystemSetting("moonshot_api_key") || process.env.MOONSHOT_API_KEY;
  return undefined;
}

// User-spezifische AI-Konfiguration lesen (falls vorhanden)
export function getUserAiConfig(userId: string): AiConfig | null {
  try {
    const settings = db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId))
      .get();

    if (!settings?.aiProvider) return null;

    const apiKey = getUserApiKey(settings as any, settings.aiProvider);
    if (!apiKey) return null;

    return {
      provider: settings.aiProvider,
      model: settings.aiModel || getDefaultModelForProvider(settings.aiProvider),
      apiKey,
      baseURL: getBaseURLForProvider(settings.aiProvider, settings.aiBaseUrl),
      thinkingEnabled: false, // User-KI: kein Thinking-Modus
    };
  } catch {
    return null;
  }
}

// Per-Provider API-Key lesen (neue Spalten + Legacy aiApiKey als Fallback)
function getUserApiKey(settings: Record<string, any>, provider: string): string | undefined {
  const colMap: Record<string, string> = {
    openai: "openaiApiKey",
    anthropic: "anthropicApiKey",
    groq: "groqApiKey",
    mistral: "mistralApiKey",
    kimi: "kimiApiKey",
    deepseek: "deepseekApiKey",
    ollama: null as any,
  };
  const colName = colMap[provider];
  if (colName && settings[colName]) return settings[colName];
  if (settings.aiApiKey) return settings.aiApiKey;
  return undefined;
}

// Standard-Modell je nach Provider
export function getDefaultModelForProvider(provider: string): string {
  switch (provider) {
    case "openai": return "gpt-4o-mini";
    case "anthropic": return "claude-sonnet-4-20250514";
    case "groq": return "llama-3.3-70b-versatile";
    case "mistral": return "mistral-small-latest";
    case "ollama": return "llama3.2";
    case "kimi": return "kimi-k2-turbo-preview";
    case "deepseek": return "deepseek-v4-pro";
    default: return "gpt-4o-mini";
  }
}

// Effektive AI-Config: User-Einstellung → System-Fallback (wenn freigegeben)
export function getEffectiveAiConfig(userId?: string): AiConfig {
  if (userId) {
    const userConfig = getUserAiConfig(userId);
    if (userConfig) return userConfig;
  }
  // System-AI nur als Fallback wenn freigegeben
  if (!isSystemAiShared()) {
    // Leere Config zurückgeben – getClient() wird null liefern
    return { provider: "none", model: "", apiKey: undefined, baseURL: "", thinkingEnabled: false };
  }
  return getSystemAiConfig();
}

// Compat-Wrapper für bestehenden Code
function getAiConfig() {
  return getSystemAiConfig();
}

function getClient(config?: AiConfig): OpenAI | null {
  const cfg = config || getAiConfig();
  if (!cfg.apiKey && cfg.provider !== "ollama") {
    return null;
  }
  return new OpenAI({
    apiKey: cfg.apiKey || "ollama",
    baseURL: cfg.baseURL,
  });
}

export async function analyzeBookmark(
  url: string,
  title: string | null,
  description: string | null,
  existingTags: Tag[],
  existingFolders: Folder[],
  language: string = "de",
  overrideConfig?: AiConfig
): Promise<AiSuggestion | null> {
  const config = overrideConfig || getAiConfig();
  const client = getClient(config);
  if (!client) return null;
  const tagNames = existingTags.map((t) => t.name);
  const folderTree = buildFolderContext(existingFolders);

  const langLabel = language === "de" ? "Deutsch" : "English";
  const langInstruction = language === "de"
    ? "Alle Tags, Ordnernamen und die Zusammenfassung MÜSSEN auf Deutsch sein."
    : "All tags, folder names and the summary MUST be in English.";

  const prompt = `Du bist ein intelligenter Bookmark-Organizer. Analysiere den folgenden Link und gib eine JSON-Antwort zurück.

Sprache: ${langLabel}
${langInstruction}

URL: ${url}
Titel: ${title || "unbekannt"}
Beschreibung: ${description || "keine"}

Existierende Tags des Users: ${tagNames.length > 0 ? tagNames.join(", ") : "noch keine"}

Existierende Ordnerstruktur:
${folderTree || "noch keine Ordner"}

Aufgaben:
1. Schlage 3-7 passende Tags vor (bevorzuge existierende Tags, erstelle neue nur wenn nötig)
2. Ordne das Lesezeichen dem EINEN am besten passenden Ordner zu. Beachte dabei:
   - Wähle den spezifischsten Ordner, der INHALTLICH EXAKT zum Thema der Seite passt.
   - Sei STRENG: Ein allgemeiner Nachrichtenportal (z.B. Spiegel, Welt) gehört NICHT in einen spezialisierten Ordner (z.B. "IT-News"), sondern in einen allgemeinen (z.B. "Nachrichten").
   - Der Ordnername muss zum HAUPTTHEMA der Website passen, nicht zu einem Nebenthema.
   - Wenn KEIN existierender Ordner gut passt, schlage einen neuen Ordnernamen vor.
   - Setze folderId NUR wenn du dir SICHER bist, dass es der richtige Ordner ist.
3. Fasse den Inhalt in 4-6 Sätzen zusammen (ausführlich, aber prägnant)

Antworte NUR mit folgendem JSON-Format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "folderName": "Name des vorgeschlagenen Ordners",
  "folderId": null,
  "summary": "Ausführliche Zusammenfassung in 4-6 Sätzen."
}

Wenn ein existierender Ordner passt, setze "folderId" auf die ID und "folderName" auf den Namen.
Tags sollen kleingeschrieben sein, ohne Sonderzeichen, ausschließlich auf ${langLabel}.`;

  try {
    const params: Record<string, any> = {
      model: config.model,
      messages: [
        {
          role: "system",
          content: "Du bist ein präziser Bookmark-Kategorisierer. Ordne Lesezeichen STRENG nach dem Hauptthema der Website zu – nicht nach Nebenthemen. Ein allgemeines Nachrichtenportal ist KEINE IT-Seite, auch wenn es IT-Artikel enthält. Antworte immer mit validem JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    };

    if (config.provider === "kimi") {
      params.thinking = { type: config.thinkingEnabled ? "enabled" : "disabled" };
    } else if (config.provider === "deepseek") {
      params.thinking = { type: config.thinkingEnabled ? "enabled" : "disabled" };
      if (config.thinkingEnabled) params.reasoning_effort = "high";
    } else {
      params.temperature = 0.3;
    }

    const completion = await client.chat.completions.create(params as any);

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const result = JSON.parse(content);

    return {
      tags: Array.isArray(result.tags) ? result.tags.map((t: string) => t.toLowerCase().trim()) : [],
      folderId: typeof result.folderId === "number" ? result.folderId : null,
      folderName: typeof result.folderName === "string" ? result.folderName : null,
      summary: typeof result.summary === "string" ? result.summary : "",
    };
  } catch (error) {
    console.error("❌ AI analysis error:", error);
    return null;
  }
}

export async function batchAnalyze(
  bookmarks: Array<{ url: string; title: string | null }>,
  existingTags: Tag[],
  existingFolders: Folder[]
): Promise<Map<string, AiSuggestion>> {
  const client = getClient();
  if (!client) return new Map();

  const config = getAiConfig();
  const tagNames = existingTags.map((t) => t.name);
  const folderTree = buildFolderContext(existingFolders);

  const bookmarkList = bookmarks
    .map((b, i) => `${i + 1}. URL: ${b.url} | Titel: ${b.title || "unbekannt"}`)
    .join("\n");

  const prompt = `Du bist ein intelligenter Bookmark-Organizer. Kategorisiere die folgenden ${bookmarks.length} Bookmarks.

Bookmarks:
${bookmarkList}

Existierende Tags: ${tagNames.length > 0 ? tagNames.join(", ") : "noch keine"}
Existierende Ordnerstruktur:
${folderTree || "noch keine Ordner"}

WICHTIG zur Ordner-Zuordnung:
- Ordne jedes Bookmark dem EINEN Ordner zu, der INHALTLICH EXAKT zum Hauptthema passt.
- Sei STRENG: Allgemeine Nachrichtenportale gehören NICHT in spezialisierte Ordner (z.B. "IT-News"), auch wenn sie gelegentlich IT-Artikel enthalten.
- Der Ordner muss zum KERNTHEMA der Website passen, nicht zu einem Nebenthema.

Antworte mit einem JSON-Array, ein Objekt pro Bookmark in der gleichen Reihenfolge:
[
  {
    "url": "...",
    "tags": ["tag1", "tag2"],
    "folderName": "Ordnername",
    "summary": "Kurze Zusammenfassung"
  }
]`;

  try {
    const params: Record<string, any> = {
      model: config.model,
      messages: [
        {
          role: "system",
          content: "Du bist ein präziser Bookmark-Kategorisierer. Ordne Lesezeichen STRENG nach dem Hauptthema der Website zu – nicht nach Nebenthemen. Ein allgemeines Nachrichtenportal ist KEINE IT-Seite, auch wenn es IT-Artikel enthält. Antworte immer mit validem JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    };

    if (config.provider === "kimi") {
      params.thinking = { type: config.thinkingEnabled ? "enabled" : "disabled" };
    } else if (config.provider === "deepseek") {
      params.thinking = { type: config.thinkingEnabled ? "enabled" : "disabled" };
      if (config.thinkingEnabled) params.reasoning_effort = "high";
    } else {
      params.temperature = 0.3;
    }

    const completion = await client.chat.completions.create(params as any);

    const content = completion.choices[0]?.message?.content;
    if (!content) return new Map();

    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : parsed.bookmarks || [];

    const map = new Map<string, AiSuggestion>();
    for (const item of results) {
      if (item.url) {
        map.set(item.url, {
          tags: item.tags || [],
          folderId: null,
          folderName: item.folderName || null,
          summary: item.summary || "",
        });
      }
    }
    return map;
  } catch (error) {
    console.error("❌ AI batch analysis error:", error);
    return new Map();
  }
}

function buildFolderContext(folders: Folder[], parentId: number | null = null, depth = 0): string {
  const children = folders.filter((f) => f.parentId === parentId);
  if (children.length === 0) return "";

  return children
    .map((f) => {
      const indent = "  ".repeat(depth);
      const subFolders = buildFolderContext(folders, f.id, depth + 1);
      return `${indent}- ${f.name} (ID: ${f.id})${subFolders ? "\n" + subFolders : ""}`;
    })
    .join("\n");
}

export function isAiConfigured(): boolean {
  const config = getAiConfig();
  return !!(config.apiKey || config.provider === "ollama");
}

// Prüft ob die System-AI für alle User freigegeben ist
export function isSystemAiShared(): boolean {
  const setting = getSystemSetting("ai_shared_enabled");
  // Default: true (abwärtskompatibel – System-AI ist standardmäßig freigegeben)
  return setting !== "false";
}

// Prüft ob für einen User AI verfügbar ist (eigene Config oder System-Config wenn freigegeben)
export function isAiConfiguredForUser(userId: string): boolean {
  const userConfig = getUserAiConfig(userId);
  if (userConfig) return true;
  // System-AI nur nutzen wenn freigegeben
  if (!isSystemAiShared()) return false;
  return isAiConfigured();
}

export async function testAiConnection(overrideConfig?: AiConfig): Promise<{ success: boolean; message: string; duration: number }> {
  const config = overrideConfig || getAiConfig();
  const client = getClient(config);

  if (!client) {
    return { success: false, message: "No API key configured", duration: 0 };
  }

  const start = Date.now();
  try {
    const params: Record<string, any> = {
      model: config.model,
      messages: [
        { role: "user", content: "Respond with exactly: OK" },
      ],
      max_tokens: 10,
    };

    if (config.provider === "kimi") {
      params.thinking = { type: "disabled" };
      delete params.max_tokens;
    } else if (config.provider === "deepseek") {
      params.thinking = { type: "disabled" };
    } else {
      params.temperature = 0;
    }

    const completion = await client.chat.completions.create(params as any);
    const content = completion.choices[0]?.message?.content || "";
    const duration = Date.now() - start;

    return {
      success: true,
      message: `${config.provider}/${config.model} – "${content.trim().slice(0, 50)}"`,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    return {
      success: false,
      message: error?.message || "Unknown error",
      duration,
    };
  }
}
