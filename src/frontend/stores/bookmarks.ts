import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Bookmark, BookmarkWithRelations, PaginatedResponse } from "../../shared/types";

export const useBookmarksStore = defineStore("bookmarks", () => {
  const bookmarks = ref<BookmarkWithRelations[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(0);
  const hasMore = ref(false);

  async function fetchBookmarks(params: Record<string, string> = {}) {
    loading.value = true;
    try {
      const query = new URLSearchParams({ limit: "20", offset: "0", ...params });
      const res = await fetch(`/api/bookmarks?${query}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data: PaginatedResponse<BookmarkWithRelations> = await res.json();
      bookmarks.value = data.data;
      total.value = data.total;
      hasMore.value = data.hasMore;
      currentPage.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore(params: Record<string, string> = {}) {
    const offset = bookmarks.value.length;
    loading.value = true;
    try {
      const query = new URLSearchParams({ limit: "20", offset: String(offset), ...params });
      const res = await fetch(`/api/bookmarks?${query}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data: PaginatedResponse<BookmarkWithRelations> = await res.json();
      bookmarks.value.push(...data.data);
      hasMore.value = data.hasMore;
    } finally {
      loading.value = false;
    }
  }

  async function createBookmark(data: { url: string; title?: string; folderId?: number; tags?: string[] }) {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Fehler beim Erstellen");
    }
    const bookmark = await res.json();
    // Automatisch oben einfügen
    bookmarks.value.unshift({ ...bookmark, tags: [], folders: [] });
    total.value++;
    return bookmark;
  }

  async function updateBookmark(id: number, data: Partial<Bookmark>) {
    const res = await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Fehler beim Aktualisieren");
    const updated = await res.json();
    const index = bookmarks.value.findIndex((b) => b.id === id);
    if (index !== -1) {
      bookmarks.value[index] = { ...bookmarks.value[index]!, ...updated };
    }
    return updated;
  }

  async function deleteBookmark(id: number) {
    const res = await fetch(`/api/bookmarks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Fehler beim Löschen");
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id);
    total.value--;
  }

  async function toggleFavorite(id: number) {
    const bookmark = bookmarks.value.find((b) => b.id === id);
    if (!bookmark) return;
    return updateBookmark(id, { isFavorite: !bookmark.isFavorite });
  }

  async function toggleRead(id: number) {
    const bookmark = bookmarks.value.find((b) => b.id === id);
    if (!bookmark) return;
    return updateBookmark(id, { isRead: !bookmark.isRead });
  }

  return {
    bookmarks,
    loading,
    total,
    hasMore,
    fetchBookmarks,
    loadMore,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    toggleRead,
  };
});
