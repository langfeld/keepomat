import { z } from "zod";

// ── Bookmark ──
export const createBookmarkSchema = z.object({
  url: z.string().url("Ungültige URL"),
  title: z.string().optional(),
  description: z.string().optional(),
  folderId: z.number().int().positive().optional(),
  folderIds: z.array(z.number().int().positive()).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  skipAi: z.boolean().optional(),
});

export const updateBookmarkSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  isRead: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  folderId: z.number().int().positive().optional(),
  folderIds: z.array(z.number().int().positive()).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
});

// ── Folder ──
export const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.number().int().positive().nullable().optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  position: z.number().int().min(0).optional(),
});

// ── Tag ──
export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const mergeTagsSchema = z.object({
  sourceTagId: z.number().int().positive(),
  targetTagId: z.number().int().positive(),
});

// ── User Settings ──
export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  folderMode: z.enum(["single", "multi"]).optional(),
  language: z.string().min(2).max(5).optional(),
  defaultFolderId: z.number().int().positive().nullable().optional(),
  // User-eigene AI-Konfiguration
  aiProvider: z.enum(["openai", "anthropic", "groq", "mistral", "ollama", "kimi"]).nullable().optional(),
  aiApiKey: z.string().max(500).nullable().optional(),
  aiModel: z.string().max(100).nullable().optional(),
  aiBaseUrl: z.string().url().max(500).nullable().optional(),
});

// ── API Key ──
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// ── Auth ──
export const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
  name: z.string().min(1, "Name ist erforderlich").max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Search ──
export const searchSchema = z.object({
  q: z.string().min(1).max(500),
  folderId: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  isRead: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ── Import ──
export const importBookmarksSchema = z.object({
  html: z.string().min(1),
  categorize: z.boolean().default(false),
});

// ── Shared Folder ──
export const shareFolderSchema = z.object({
  userId: z.string().min(1),
  permission: z.enum(["read", "write", "admin"]),
});

// ── System Settings (Admin) ──
export const updateSystemSettingsSchema = z.object({
  moonshot_api_key: z.string().optional(),
  ai_model: z.string().optional(),
  ai_provider: z.enum(["kimi", "openai", "anthropic", "ollama"]).optional(),
  ai_thinking_enabled: z.enum(["true", "false"]).optional(),
  ai_shared_enabled: z.enum(["true", "false"]).optional(),
  ollama_url: z.string().url().optional(),
  registration_enabled: z.enum(["true", "false"]).optional(),
  telegram_bot_token: z.string().optional(),
});

// ── Types (abgeleitet aus Schema) ──
export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
export type CreateFolder = z.infer<typeof createFolderSchema>;
export type UpdateFolder = z.infer<typeof updateFolderSchema>;
export type CreateTag = z.infer<typeof createTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type ShareFolder = z.infer<typeof shareFolderSchema>;
