import { defineStore } from "pinia";
import { ref } from "vue";
import type { FolderTree, Folder } from "../../shared/types";

export const useFoldersStore = defineStore("folders", () => {
  const tree = ref<FolderTree[]>([]);
  const flatFolders = ref<Folder[]>([]);
  const loading = ref(false);
  const activeFolderId = ref<number | null>(null);

  async function fetchTree() {
    loading.value = true;
    try {
      const res = await fetch("/api/folders/tree", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      tree.value = data.tree;
    } finally {
      loading.value = false;
    }
  }

  async function fetchFlat() {
    const res = await fetch("/api/folders", { credentials: "include" });
    if (!res.ok) throw new Error("Fehler beim Laden");
    flatFolders.value = await res.json();
  }

  async function createFolder(name: string, parentId: number | null = null) {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, parentId }),
    });
    if (!res.ok) throw new Error("Fehler beim Erstellen");
    await fetchTree();
    return res.json();
  }

  async function updateFolder(id: number, data: Partial<Folder>) {
    const res = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Fehler beim Aktualisieren");
    await fetchTree();
    return res.json();
  }

  async function deleteFolder(id: number) {
    const res = await fetch(`/api/folders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Fehler beim Löschen");
    if (activeFolderId.value === id) activeFolderId.value = null;
    await fetchTree();
  }

  function setActiveFolder(id: number | null) {
    activeFolderId.value = id;
  }

  return {
    tree,
    flatFolders,
    loading,
    activeFolderId,
    fetchTree,
    fetchFlat,
    createFolder,
    updateFolder,
    deleteFolder,
    setActiveFolder,
  };
});
