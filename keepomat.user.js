// ==UserScript==
// @name         Keepomat – Bookmark Saver
// @namespace    keepomat
// @version      1.0.0
// @description  Save bookmarks to your Keepomat instance with one click or Alt+K
// @author       Keepomat
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      *
// @noframes
// @downloadURL  {{DOWNLOAD_URL}}
// @updateURL    {{UPDATE_URL}}
// ==/UserScript==

(function () {
  "use strict";

  // ── Config ──
  const CONFIG_KEYS = {
    serverUrl: "keepomat_server_url",
    apiKey: "keepomat_api_key",
  };

  function getConfig() {
    return {
      serverUrl: (GM_getValue(CONFIG_KEYS.serverUrl, "") || "").replace(/\/$/, ""),
      apiKey: GM_getValue(CONFIG_KEYS.apiKey, ""),
    };
  }

  function saveConfig(serverUrl, apiKey) {
    GM_setValue(CONFIG_KEYS.serverUrl, serverUrl.replace(/\/$/, ""));
    GM_setValue(CONFIG_KEYS.apiKey, apiKey);
  }

  // ── API Helpers ──
  function apiRequest(method, path, data) {
    const config = getConfig();
    return new Promise((resolve, reject) => {
      if (!config.serverUrl || !config.apiKey) {
        reject(new Error("Nicht konfiguriert"));
        return;
      }
      GM_xmlhttpRequest({
        method,
        url: `${config.serverUrl}${path}`,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
        },
        data: data ? JSON.stringify(data) : undefined,
        onload(response) {
          if (response.status >= 200 && response.status < 300) {
            try {
              resolve(JSON.parse(response.responseText));
            } catch {
              resolve(response.responseText);
            }
          } else {
            try {
              const err = JSON.parse(response.responseText);
              reject(new Error(err.error || `HTTP ${response.status}`));
            } catch {
              reject(new Error(`HTTP ${response.status}`));
            }
          }
        },
        onerror() {
          reject(new Error("Netzwerkfehler"));
        },
      });
    });
  }

  // ── Styles ──
  GM_addStyle(`
    #keepomat-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      opacity: 0;
      transition: opacity 0.15s;
    }
    #keepomat-overlay.km-visible { opacity: 1; }

    #keepomat-panel {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      width: 380px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.95);
      transition: transform 0.15s;
    }
    #keepomat-overlay.km-visible #keepomat-panel { transform: scale(1); }

    .km-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .km-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .km-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      font-size: 20px;
      padding: 4px;
      line-height: 1;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
    }
    .km-close:hover { background: #f3f4f6; color: #374151; }

    .km-body { padding: 16px 20px; }

    .km-field { margin-bottom: 12px; }
    .km-field label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .km-field input, .km-field select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 13px;
      color: #111827;
      background: #f9fafb;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .km-field input:focus, .km-field select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    .km-footer {
      padding: 12px 20px 16px;
      display: flex;
      gap: 8px;
    }
    .km-btn {
      flex: 1;
      padding: 9px 16px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }
    .km-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .km-btn-primary {
      background: #6366f1;
      color: #fff;
    }
    .km-btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .km-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .km-btn-secondary:hover:not(:disabled) { background: #e5e7eb; }

    .km-status {
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      margin: 0 20px 12px;
      text-align: center;
    }
    .km-status-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .km-status-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .km-hint {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }

    /* FAB Button */
    #keepomat-fab {
      position: fixed;
      z-index: 2147483645;
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: transparent;
      border: none;
      cursor: grab;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
      opacity: 0.45;
      user-select: none;
      touch-action: none;
      padding: 0;
    }
    #keepomat-fab svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    #keepomat-fab:hover {
      opacity: 1;
      box-shadow: 0 4px 14px rgba(59,130,246,0.5);
      transform: scale(1.08);
    }
    #keepomat-fab.km-dragging {
      cursor: grabbing;
      opacity: 0.95;
      box-shadow: 0 6px 20px rgba(59,130,246,0.5);
      transform: scale(1.12);
    }

    /* Setup-Modus */
    .km-setup-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #1e40af;
      line-height: 1.5;
    }
  `);

  // ── UI ──
  let overlayEl = null;
  let folders = [];

  const FAB_POS_KEY = "keepomat_fab_position";

  function getFabPosition() {
    try {
      const stored = GM_getValue(FAB_POS_KEY, null);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  }

  function saveFabPosition(x, y) {
    GM_setValue(FAB_POS_KEY, JSON.stringify({ x, y }));
  }

  function clampPosition(x, y, size) {
    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  }

  function applyFabPosition(fab) {
    const pos = getFabPosition();
    const size = 40;
    if (pos) {
      const clamped = clampPosition(pos.x, pos.y, size);
      fab.style.left = clamped.x + "px";
      fab.style.top = clamped.y + "px";
    } else {
      fab.style.left = (window.innerWidth - size - 20) + "px";
      fab.style.top = (window.innerHeight - size - 20) + "px";
    }
  }

  function createFAB() {
    if (document.getElementById("keepomat-fab")) return;
    const fab = document.createElement("button");
    fab.id = "keepomat-fab";
    fab.title = "In Keepomat speichern (Alt+K) – ziehen zum Verschieben";
    fab.innerHTML = '<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#3b82f6"/><path d="M8 8h6v2H10v12h4v2H8V8zm10 0h6v16h-6v-2h4V10h-4V8z" fill="white"/><circle cx="16" cy="16" r="3" fill="#fbbf24"/></svg>';
    document.body.appendChild(fab);
    applyFabPosition(fab);

    // ── Drag & Drop ──
    let isDragging = false;
    let wasDragged = false;
    let startX, startY, origX, origY;
    const DRAG_THRESHOLD = 5;

    function onPointerDown(e) {
      if (e.button !== 0) return;
      isDragging = false;
      wasDragged = false;
      startX = e.clientX;
      startY = e.clientY;
      origX = fab.offsetLeft;
      origY = fab.offsetTop;
      fab.setPointerCapture(e.pointerId);
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      e.preventDefault();
    }

    function onPointerMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!isDragging && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;

      isDragging = true;
      wasDragged = true;
      fab.classList.add("km-dragging");

      const clamped = clampPosition(origX + dx, origY + dy, 40);
      fab.style.left = clamped.x + "px";
      fab.style.top = clamped.y + "px";
    }

    function onPointerUp(e) {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      fab.classList.remove("km-dragging");

      if (isDragging) {
        saveFabPosition(fab.offsetLeft, fab.offsetTop);
        isDragging = false;
      }
    }

    fab.addEventListener("pointerdown", onPointerDown);
    fab.addEventListener("click", (e) => {
      if (wasDragged) {
        e.preventDefault();
        e.stopImmediatePropagation();
        wasDragged = false;
        return;
      }
      openPanel();
    });

    // Bei Fenster-Resize Position clampen
    window.addEventListener("resize", () => applyFabPosition(fab));
  }

  function openPanel() {
    if (overlayEl) return;
    const config = getConfig();

    // Setup oder Speichern?
    if (!config.serverUrl || !config.apiKey) {
      openSetup();
    } else {
      openSavePanel(config);
    }
  }

  function closePanel() {
    if (!overlayEl) return;
    overlayEl.classList.remove("km-visible");
    setTimeout(() => {
      overlayEl?.remove();
      overlayEl = null;
    }, 150);
  }

  function openSetup() {
    const config = getConfig();
    overlayEl = document.createElement("div");
    overlayEl.id = "keepomat-overlay";
    overlayEl.innerHTML = `
      <div id="keepomat-panel">
        <div class="km-header">
          <h2>🔖 Keepomat Setup</h2>
          <button class="km-close" id="km-close">&times;</button>
        </div>
        <div class="km-body">
          <div class="km-setup-info">
            Verbinde dieses Userscript mit deiner Keepomat-Instanz.<br>
            Du findest den API-Schlüssel in den Keepomat-Einstellungen.
          </div>
          <div class="km-field">
            <label>Server-URL</label>
            <input type="url" id="km-server" placeholder="https://keepomat.example.com" value="${config.serverUrl}" />
          </div>
          <div class="km-field">
            <label>API-Schlüssel</label>
            <input type="text" id="km-apikey" placeholder="km_..." value="${config.apiKey}" />
          </div>
        </div>
        <div id="km-status-area"></div>
        <div class="km-footer">
          <button class="km-btn km-btn-secondary" id="km-cancel">Abbrechen</button>
          <button class="km-btn km-btn-primary" id="km-connect">Verbinden</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);
    requestAnimationFrame(() => overlayEl.classList.add("km-visible"));

    overlayEl.querySelector("#km-close").addEventListener("click", closePanel);
    overlayEl.querySelector("#km-cancel").addEventListener("click", closePanel);
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closePanel();
    });

    overlayEl.querySelector("#km-connect").addEventListener("click", async () => {
      const serverUrl = overlayEl.querySelector("#km-server").value.trim();
      const apiKey = overlayEl.querySelector("#km-apikey").value.trim();
      const statusArea = overlayEl.querySelector("#km-status-area");

      if (!serverUrl || !apiKey) {
        statusArea.innerHTML = '<div class="km-status km-status-error">Bitte alle Felder ausfüllen</div>';
        return;
      }

      const btn = overlayEl.querySelector("#km-connect");
      btn.disabled = true;
      btn.textContent = "Verbinde...";

      // Temporär speichern zum Testen
      saveConfig(serverUrl, apiKey);

      try {
        await apiRequest("GET", "/api/health");
        statusArea.innerHTML = '<div class="km-status km-status-success">Verbunden! ✓</div>';
        setTimeout(() => {
          closePanel();
        }, 800);
      } catch (err) {
        // Config zurücksetzen bei Fehler
        saveConfig("", "");
        statusArea.innerHTML = `<div class="km-status km-status-error">Verbindung fehlgeschlagen: ${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = "Verbinden";
      }
    });
  }

  async function openSavePanel(config) {
    overlayEl = document.createElement("div");
    overlayEl.id = "keepomat-overlay";
    overlayEl.innerHTML = `
      <div id="keepomat-panel">
        <div class="km-header">
          <h2>🔖 Lesezeichen speichern</h2>
          <button class="km-close" id="km-close">&times;</button>
        </div>
        <div class="km-body">
          <div class="km-field">
            <label>URL</label>
            <input type="url" id="km-url" value="${document.location.href}" />
          </div>
          <div class="km-field">
            <label>Titel</label>
            <input type="text" id="km-title" value="${(document.title || "").replace(/"/g, "&quot;")}" />
          </div>
          <div class="km-field">
            <label>Tags (kommagetrennt)</label>
            <input type="text" id="km-tags" placeholder="web, tools, dev" />
          </div>
          <div class="km-field">
            <label>Ordner</label>
            <select id="km-folder">
              <option value="">Kein Ordner</option>
            </select>
          </div>
        </div>
        <div id="km-status-area"></div>
        <div class="km-footer">
          <button class="km-btn km-btn-secondary" id="km-cancel">Abbrechen</button>
          <button class="km-btn km-btn-primary" id="km-save">Speichern</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);
    requestAnimationFrame(() => overlayEl.classList.add("km-visible"));

    // Event-Listener
    overlayEl.querySelector("#km-close").addEventListener("click", closePanel);
    overlayEl.querySelector("#km-cancel").addEventListener("click", closePanel);
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closePanel();
    });

    // Ordner laden
    try {
      folders = await apiRequest("GET", "/api/folders");
      const select = overlayEl.querySelector("#km-folder");
      if (select && Array.isArray(folders)) {
        folders.forEach((f) => {
          const opt = document.createElement("option");
          opt.value = f.id;
          opt.textContent = (f.icon ? f.icon + " " : "") + f.name;
          select.appendChild(opt);
        });
      }
    } catch {
      // Ordner konnten nicht geladen werden – kein Problem
    }

    // Speichern
    overlayEl.querySelector("#km-save").addEventListener("click", async () => {
      const url = overlayEl.querySelector("#km-url").value.trim();
      const title = overlayEl.querySelector("#km-title").value.trim();
      const tags = overlayEl.querySelector("#km-tags").value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const folderId = overlayEl.querySelector("#km-folder").value;
      const statusArea = overlayEl.querySelector("#km-status-area");

      if (!url) {
        statusArea.innerHTML = '<div class="km-status km-status-error">URL ist erforderlich</div>';
        return;
      }

      const btn = overlayEl.querySelector("#km-save");
      btn.disabled = true;
      btn.textContent = "Speichern...";

      try {
        const body = { url, title };
        if (tags.length) body.tags = tags;
        if (folderId) body.folderIds = [folderId];

        await apiRequest("POST", "/api/bookmarks", body);
        statusArea.innerHTML = '<div class="km-status km-status-success">Lesezeichen gespeichert! ✓</div>';
        setTimeout(closePanel, 1000);
      } catch (err) {
        statusArea.innerHTML = `<div class="km-status km-status-error">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = "Speichern";
      }
    });

    // Fokus auf Tags (URL + Titel sind schon befüllt)
    setTimeout(() => overlayEl?.querySelector("#km-tags")?.focus(), 200);
  }

  // ── Keyboard Shortcut ──
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPanel();
    }
    if (e.key === "Escape" && overlayEl) {
      closePanel();
    }
  });

  // ── Menu Command ──
  GM_registerMenuCommand("In Keepomat speichern", openPanel);
  GM_registerMenuCommand("Keepomat Setup", openSetup);

  // ── Init ──
  createFAB();
})();
