import OpenAI from "openai";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import type { AiSuggestion, Folder, Tag } from "../../shared/types";

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

function getAiConfig() {
  const provider = getSystemSetting("ai_provider") || process.env.AI_PROVIDER || "kimi";
  const model = getSystemSetting("ai_model") || process.env.AI_MODEL || "kimi-k2-turbo-preview";
  const apiKey = getSystemSetting("moonshot_api_key") || process.env.MOONSHOT_API_KEY;
  const thinkingEnabled = (getSystemSetting("ai_thinking_enabled") || process.env.AI_THINKING_ENABLED || "false") === "true";

  let baseURL: string;
  switch (provider) {
    case "openai":
      baseURL = "https://api.openai.com/v1";
      break;
    case "anthropic":
      baseURL = "https://api.anthropic.com/v1";
      break;
    case "ollama":
      baseURL = getSystemSetting("ollama_url") || process.env.OLLAMA_URL || "http://localhost:11434/v1";
      break;
    case "kimi":
    default:
      baseURL = "https://api.moonshot.ai/v1";
      break;
  }

  return { provider, model, apiKey, baseURL, thinkingEnabled };
}

function getClient(): OpenAI | null {
  const config = getAiConfig();
  if (!config.apiKey && config.provider !== "ollama") {
    return null;
  }
  return new OpenAI({
    apiKey: config.apiKey || "ollama",
    baseURL: config.baseURL,
  });
}

export async function analyzeBookmark(
  url: string,
  title: string | null,
  description: string | null,
  existingTags: Tag[],
  existingFolders: Folder[],
  language: string = "de"
): Promise<AiSuggestion | null> {
  const client = getClient();
  if (!client) return null;

  const config = getAiConfig();
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
2. Schlage den passendsten existierenden Ordner vor (oder einen neuen Ordnernamen)
3. Fasse den Inhalt in 2-3 kurzen Sätzen zusammen

Antworte NUR mit folgendem JSON-Format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "folderName": "Name des vorgeschlagenen Ordners",
  "folderId": null,
  "summary": "Zusammenfassung in 2-3 Sätzen."
}

Wenn ein existierender Ordner passt, setze "folderId" auf die ID und "folderName" auf den Namen.
Tags sollen kleingeschrieben sein, ohne Sonderzeichen, ausschließlich auf ${langLabel}.`;

  try {
    const params: Record<string, any> = {
      model: config.model,
      messages: [
        {
          role: "system",
          content: "Du bist ein präziser Bookmark-Kategorisierer. Antworte immer mit validem JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    };

    if (config.provider === "kimi") {
      params.thinking = { type: config.thinkingEnabled ? "enabled" : "disabled" };
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
          content: "Du bist ein präziser Bookmark-Kategorisierer. Antworte immer mit validem JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    };

    if (config.provider === "kimi") {
      params.thinking = { type: config.thinkingEnabled ? "enabled" : "disabled" };
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

export async function testAiConnection(): Promise<{ success: boolean; message: string; duration: number }> {
  const config = getAiConfig();
  const client = getClient();

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
