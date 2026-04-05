import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Users ──
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  role: text("role").default("user"),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
  isDisabled: integer("is_disabled", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Sessions (Better Auth) ──
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Accounts (Better Auth – für Email/Password + OAuth) ──
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Verification (Better Auth) ──
export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Folders (Adjacency List für unbegrenzte Verschachtelung) ──
export const folders = sqliteTable("folders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  parentId: integer("parent_id").references((): any => folders.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  position: integer("position").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Bookmarks ──
export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  ogImage: text("og_image"),
  favicon: text("favicon"),
  aiSummary: text("ai_summary"),
  screenshot: text("screenshot"),
  isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false).notNull(),
  isDeadLink: integer("is_dead_link", { mode: "boolean" }).default(false).notNull(),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Tags ──
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [
  uniqueIndex("tags_name_user_idx").on(t.name, t.userId),
]);

// ── Bookmark ↔ Tag (m:n) ──
export const bookmarkTags = sqliteTable("bookmark_tags", {
  bookmarkId: integer("bookmark_id").notNull().references(() => bookmarks.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.bookmarkId, t.tagId] }),
]);

// ── Bookmark ↔ Folder (m:n – erlaubt single- und multi-folder je nach User-Setting) ──
export const bookmarkFolders = sqliteTable("bookmark_folders", {
  bookmarkId: integer("bookmark_id").notNull().references(() => bookmarks.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").notNull().references(() => folders.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.bookmarkId, t.folderId] }),
]);

// ── Shared Folders ──
export const sharedFolders = sqliteTable("shared_folders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folderId: integer("folder_id").notNull().references(() => folders.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission", { enum: ["read", "write", "admin"] }).notNull().default("read"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── User Settings ──
export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme", { enum: ["light", "dark", "system"] }).default("system").notNull(),
  folderMode: text("folder_mode", { enum: ["single", "multi"] }).default("single").notNull(),
  language: text("language").default("en").notNull(),
  defaultFolderId: integer("default_folder_id").references(() => folders.id, { onDelete: "set null" }),
  // User-eigene AI-Konfiguration (überschreibt System-AI wenn gesetzt)
  aiProvider: text("ai_provider"),
  aiApiKey: text("ai_api_key"),
  aiModel: text("ai_model"),
  aiBaseUrl: text("ai_base_url"),
});

// ── API Keys (für Extension + Bot) ──
export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── System Settings (Admin-konfigurierbar) ──
export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ── Telegram Links (User ↔ Telegram-Chat) ──
export const telegramLinks = sqliteTable("telegram_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  telegramChatId: text("telegram_chat_id").notNull().unique(),
  telegramUsername: text("telegram_username"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});
