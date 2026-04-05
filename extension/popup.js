// Keepomat Browser Extension – Popup Script

document.addEventListener("DOMContentLoaded", async () => {
  const setupEl = document.getElementById("setup");
  const mainEl = document.getElementById("main");
  const setupStatus = document.getElementById("setupStatus");
  const mainStatus = document.getElementById("mainStatus");

  // Konfiguration laden
  const config = await chrome.storage.local.get(["serverUrl", "apiKey"]);

  if (config.serverUrl && config.apiKey) {
    showMain(config);
  } else {
    showSetup();
  }

  // Setup speichern
  document.getElementById("saveConfig").addEventListener("click", async () => {
    const serverUrl = document.getElementById("serverUrl").value.replace(/\/$/, "");
    const apiKey = document.getElementById("apiKey").value;

    if (!serverUrl || !apiKey) {
      showStatus(setupStatus, "error", "Bitte alle Felder ausfüllen");
      return;
    }

    // Verbindung testen
    try {
      const res = await fetch(`${serverUrl}/api/health`, {
        headers: { "X-API-Key": apiKey },
      });

      if (!res.ok) throw new Error("Verbindung fehlgeschlagen");

      await chrome.storage.local.set({ serverUrl, apiKey });
      showStatus(setupStatus, "success", "Verbunden!");
      setTimeout(() => showMain({ serverUrl, apiKey }), 500);
    } catch (err) {
      showStatus(setupStatus, "error", "Verbindung fehlgeschlagen. Prüfe URL und API-Schlüssel.");
    }
  });

  // Lesezeichen speichern
  document.getElementById("saveBookmark").addEventListener("click", async () => {
    const config = await chrome.storage.local.get(["serverUrl", "apiKey"]);
    const url = document.getElementById("url").value;
    const title = document.getElementById("title").value;
    const tags = document.getElementById("tags").value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const folderId = document.getElementById("folder").value;

    const btn = document.getElementById("saveBookmark");
    btn.disabled = true;
    btn.textContent = "Speichern...";

    try {
      const body = { url, title };
      if (tags.length) body.tags = tags;
      if (folderId) body.folderIds = [folderId];

      const res = await fetch(`${config.serverUrl}/api/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Speichern");
      }

      showStatus(mainStatus, "success", "Lesezeichen gespeichert! ✓");
      setTimeout(() => window.close(), 1000);
    } catch (err) {
      showStatus(mainStatus, "error", err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Speichern";
    }
  });

  // Reset
  document.getElementById("resetLink").addEventListener("click", async (e) => {
    e.preventDefault();
    await chrome.storage.local.remove(["serverUrl", "apiKey"]);
    showSetup();
  });

  // Funktionen

  function showSetup() {
    setupEl.classList.add("active");
    mainEl.classList.remove("active");
  }

  async function showMain(config) {
    setupEl.classList.remove("active");
    mainEl.classList.add("active");

    // Aktuelle Tab-Infos laden
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      document.getElementById("url").value = tab.url || "";
      document.getElementById("title").value = tab.title || "";
    }

    // Ordner laden
    try {
      const res = await fetch(`${config.serverUrl}/api/folders`, {
        headers: { "X-API-Key": config.apiKey },
      });
      if (res.ok) {
        const folders = await res.json();
        const select = document.getElementById("folder");
        select.innerHTML = '<option value="">Kein Ordner</option>';
        for (const folder of folders) {
          const opt = document.createElement("option");
          opt.value = folder.id;
          opt.textContent = folder.name;
          select.appendChild(opt);
        }
      }
    } catch {}
  }

  function showStatus(el, type, message) {
    el.className = `status ${type}`;
    el.textContent = message;
    if (type === "success") {
      setTimeout(() => (el.style.display = "none"), 3000);
    }
  }
});
