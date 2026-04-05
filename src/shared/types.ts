// ── Shared Types für Frontend + Backend ──

export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  isAdmin: boolean;
  isDisabled: boolean;
  createdAt: Date;
}

export interface Bookmark {
  id: number;
  userId: string;
  url: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
  aiSummary: string | null;
  screenshot: string | null;
  isRead: boolean;
  isFavorite: boolean;
  isDeadLink: boolean;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
  folders?: Folder[];
}

export interface Folder {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: number | null;
  userId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  children?: Folder[];
  bookmarkCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  userId: string;
  count?: number;
}

export interface UserSettings {
  userId: string;
  theme: "light" | "dark" | "system";
  folderMode: "single" | "multi";
  language: string;
  defaultFolderId: number | null;
  // User-eigene AI-Konfiguration
  aiProvider: string | null;
  aiApiKey: string | null;
  aiModel: string | null;
  aiBaseUrl: string | null;
}

export interface ApiKey {
  id: number;
  name: string;
  keyPreview: string; // nur die ersten/letzten Zeichen
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface SharedFolder {
  id: number;
  folderId: number;
  userId: string;
  permission: "read" | "write" | "admin";
  folder?: Folder;
  user?: Pick<User, "id" | "name" | "email">;
  createdAt: Date;
}

export interface SearchResult {
  bookmarks: Bookmark[];
  total: number;
  query: string;
}

export interface FolderTree extends Folder {
  children: FolderTree[];
}

export interface BookmarkWithRelations extends Bookmark {
  tags: Tag[];
  folders: Folder[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AiSuggestion {
  tags: string[];
  folderId: number | null;
  folderName: string | null;
  summary: string;
}

export interface SystemSettings {
  moonshot_api_key?: string;
  ai_model?: string;
  ai_provider?: "kimi" | "openai" | "anthropic" | "ollama";
  ai_thinking_enabled?: string;
  ai_shared_enabled?: string;
  ollama_url?: string;
  registration_enabled?: string;
  telegram_bot_token?: string;
}

export interface DashboardStats {
  totalBookmarks: number;
  totalFolders: number;
  totalTags: number;
  unreadBookmarks: number;
  deadLinks: number;
  recentBookmarks: Bookmark[];
  topTags: Tag[];
}
