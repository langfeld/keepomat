// ==UserScript==
// @name         Keepomat – Bookmark Saver
// @namespace    keepomat
// @version      1.1.0
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

    /* Searchable Folder Select */
    .km-select-wrapper {
      position: relative;
    }
    .km-select-trigger {
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
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      text-align: left;
    }
    .km-select-trigger:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }
    .km-select-trigger .km-chevron {
      width: 14px;
      height: 14px;
      color: #9ca3af;
      flex-shrink: 0;
    }
    .km-select-dropdown {
      position: fixed;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 2147483647;
      overflow: hidden;
    }
    .km-select-search {
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #111827;
      background: #f9fafb;
      outline: none;
      box-sizing: border-box;
    }
    .km-select-search:focus {
      background: #fff;
    }
    .km-select-options {
      max-height: 180px;
      overflow-y: auto;
      padding: 4px;
    }
    .km-select-option {
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #111827;
      cursor: pointer;
      transition: background 0.1s;
    }
    .km-select-option:hover, .km-select-option.km-highlighted {
      background: #eef2ff;
      color: #4338ca;
    }
    .km-select-option.km-selected {
      font-weight: 500;
      background: #eef2ff80;
    }
    .km-select-option.km-create {
      color: #6366f1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .km-select-option.km-create svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .km-select-option-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .km-select-option-row .km-folder-delete {
      display: none;
      background: none;
      border: none;
      padding: 2px;
      cursor: pointer;
      color: #9ca3af;
      border-radius: 4px;
      line-height: 1;
      flex-shrink: 0;
      transition: color 0.1s, background 0.1s;
    }
    .km-select-option:hover .km-folder-delete {
      display: flex;
    }
    .km-select-option-row .km-folder-delete:hover {
      color: #dc2626;
      background: #fef2f2;
    }
    .km-select-option-row .km-folder-delete svg {
      width: 13px;
      height: 13px;
    }
    .km-select-no-results {
      padding: 8px 10px;
      font-size: 12px;
      color: #9ca3af;
    }
    .km-select-placeholder {
      color: #9ca3af;
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
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old absolute format to edge-anchored format
        if ("x" in parsed && !("anchorX" in parsed)) {
          const size = 40;
          return absoluteToAnchored(parsed.x, parsed.y, size);
        }
        return parsed;
      }
    } catch {}
    return null;
  }

  function absoluteToAnchored(x, y, size) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    return {
      anchorX: centerX < w / 2 ? "left" : "right",
      offsetX: centerX < w / 2 ? x : w - x - size,
      anchorY: centerY < h / 2 ? "top" : "bottom",
      offsetY: centerY < h / 2 ? y : h - y - size,
    };
  }

  function saveFabPosition(x, y) {
    const size = 40;
    GM_setValue(FAB_POS_KEY, JSON.stringify(absoluteToAnchored(x, y, size)));
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
      const x = pos.anchorX === "left" ? pos.offsetX : window.innerWidth - size - pos.offsetX;
      const y = pos.anchorY === "top" ? pos.offsetY : window.innerHeight - size - pos.offsetY;
      const clamped = clampPosition(x, y, size);
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
          <h2><svg viewBox="0 0 32 32" fill="none" style="width:22px;height:22px;flex-shrink:0"><rect width="32" height="32" rx="8" fill="#3b82f6"/><path d="M8 8h6v2H10v12h4v2H8V8zm10 0h6v16h-6v-2h4V10h-4V8z" fill="white"/><circle cx="16" cy="16" r="3" fill="#fbbf24"/></svg> Keepomat Setup</h2>
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
          <h2><svg viewBox="0 0 32 32" fill="none" style="width:22px;height:22px;flex-shrink:0"><rect width="32" height="32" rx="8" fill="#3b82f6"/><path d="M8 8h6v2H10v12h4v2H8V8zm10 0h6v16h-6v-2h4V10h-4V8z" fill="white"/><circle cx="16" cy="16" r="3" fill="#fbbf24"/></svg> Lesezeichen speichern</h2>
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
            <div class="km-select-wrapper" id="km-folder-wrapper">
              <button type="button" class="km-select-trigger" id="km-folder-trigger">
                <span class="km-select-placeholder">Kein Ordner</span>
                <svg class="km-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>
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

    // Ordner laden & Searchable Select aufbauen
    let selectedFolderId = "";

    function initFolderSelect(folderList) {
      const wrapper = overlayEl.querySelector("#km-folder-wrapper");
      const trigger = overlayEl.querySelector("#km-folder-trigger");
      let dropdownEl = null;
      let searchValue = "";
      let highlightIdx = -1;

      function getFiltered() {
        if (!searchValue) return folderList;
        const q = searchValue.toLowerCase();
        return folderList.filter((f) => f.name.toLowerCase().includes(q));
      }

      function getLabel() {
        if (!selectedFolderId) return null;
        const f = folderList.find((f) => String(f.id) === String(selectedFolderId));
        return f ? (f.icon ? f.icon + " " : "") + f.name : null;
      }

      function updateTrigger() {
        const label = getLabel();
        trigger.innerHTML = label
          ? `<span>${label}</span>`
          : `<span class="km-select-placeholder">Kein Ordner</span>`;
        trigger.innerHTML += '<svg class="km-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
      }

      function closeDropdown() {
        if (dropdownEl) {
          dropdownEl.remove();
          dropdownEl = null;
        }
        document.removeEventListener("mousedown", handleOutsideClick);
      }

      function renderOptions() {
        if (!dropdownEl) return;
        const optionsContainer = dropdownEl.querySelector(".km-select-options");
        const filtered = getFiltered();
        let html = '';

        // "Kein Ordner" option
        html += `<div class="km-select-option${!selectedFolderId ? ' km-selected' : ''}${highlightIdx === -1 ? ' km-highlighted' : ''}" data-value="">Kein Ordner</div>`;

        filtered.forEach((f, i) => {
          const label = (f.icon ? f.icon + " " : "") + f.name;
          const isSelected = String(f.id) === String(selectedFolderId);
          const isHighlighted = highlightIdx === i;
          html += `<div class="km-select-option${isSelected ? ' km-selected' : ''}${isHighlighted ? ' km-highlighted' : ''}" data-value="${f.id}"><div class="km-select-option-row"><span>${label}</span><button type="button" class="km-folder-delete" data-delete-id="${f.id}" title="Ordner löschen"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>`;
        });

        // "Create new" option when search has no results
        if (searchValue.trim() && filtered.length === 0) {
          html += `<div class="km-select-option km-create" data-action="create">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            „${searchValue.trim()}" erstellen
          </div>`;
        }

        optionsContainer.innerHTML = html;

        // Click listeners for select
        optionsContainer.querySelectorAll(".km-select-option").forEach((el) => {
          el.addEventListener("click", (ev) => {
            // Ignore clicks on delete button
            if (ev.target.closest(".km-folder-delete")) return;
            if (el.dataset.action === "create") {
              createFolderInline(searchValue.trim());
              return;
            }
            selectedFolderId = el.dataset.value;
            updateTrigger();
            closeDropdown();
          });
        });

        // Click listeners for delete buttons
        optionsContainer.querySelectorAll(".km-folder-delete").forEach((btn) => {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const folderId = btn.dataset.deleteId;
            if (folderId && confirm("Ordner wirklich löschen?")) {
              deleteFolderInline(folderId);
            }
          });
        });
      }

      async function createFolderInline(name) {
        try {
          const result = await apiRequest("POST", "/api/folders", { name });
          const newFolder = { id: result.id, name: result.name, icon: result.icon || "" };
          folderList.push(newFolder);
          folders = folderList;
          selectedFolderId = String(newFolder.id);
          updateTrigger();
          closeDropdown();
        } catch (err) {
          const statusArea = overlayEl.querySelector("#km-status-area");
          if (statusArea) {
            statusArea.innerHTML = `<div class="km-status km-status-error">Ordner-Erstellung fehlgeschlagen: ${err.message}</div>`;
          }
        }
      }

      async function deleteFolderInline(folderId) {
        try {
          await apiRequest("DELETE", "/api/folders/" + folderId);
          const idx = folderList.findIndex((f) => String(f.id) === String(folderId));
          if (idx !== -1) folderList.splice(idx, 1);
          folders = folderList;
          if (String(selectedFolderId) === String(folderId)) {
            selectedFolderId = "";
            updateTrigger();
          }
          renderOptions();
        } catch (err) {
          const statusArea = overlayEl.querySelector("#km-status-area");
          if (statusArea) {
            statusArea.innerHTML = `<div class="km-status km-status-error">Löschen fehlgeschlagen: ${err.message}</div>`;
          }
        }
      }

      function openDropdown() {
        if (dropdownEl) { closeDropdown(); return; }
        searchValue = "";
        highlightIdx = -1;

        dropdownEl = document.createElement("div");
        dropdownEl.className = "km-select-dropdown";
        dropdownEl.innerHTML = `
          <input type="text" class="km-select-search" placeholder="Suchen oder erstellen…" />
          <div class="km-select-options"></div>
        `;
        document.body.appendChild(dropdownEl);

        // Position fixed relative to trigger
        const triggerRect = trigger.getBoundingClientRect();
        dropdownEl.style.left = triggerRect.left + "px";
        dropdownEl.style.width = triggerRect.width + "px";
        dropdownEl.style.top = (triggerRect.bottom + 4) + "px";

        const searchInput = dropdownEl.querySelector(".km-select-search");
        searchInput.focus();

        searchInput.addEventListener("input", () => {
          searchValue = searchInput.value;
          highlightIdx = -1;
          renderOptions();
        });

        searchInput.addEventListener("keydown", (e) => {
          const filtered = getFiltered();
          const maxIdx = filtered.length - 1;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            highlightIdx = Math.min(maxIdx, highlightIdx + 1);
            renderOptions();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            highlightIdx = Math.max(-1, highlightIdx - 1);
            renderOptions();
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (searchValue.trim() && filtered.length === 0) {
              createFolderInline(searchValue.trim());
            } else if (highlightIdx === -1) {
              selectedFolderId = "";
              updateTrigger();
              closeDropdown();
            } else if (filtered[highlightIdx]) {
              selectedFolderId = String(filtered[highlightIdx].id);
              updateTrigger();
              closeDropdown();
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            closeDropdown();
          }
        });

        renderOptions();

        // Close on outside click
        setTimeout(() => {
          document.addEventListener("mousedown", handleOutsideClick);
        }, 0);
      }

      function handleOutsideClick(e) {
        if (
          wrapper && !wrapper.contains(e.target) &&
          dropdownEl && !dropdownEl.contains(e.target)
        ) {
          closeDropdown();
        }
      }

      trigger.addEventListener("click", openDropdown);
      updateTrigger();
    }

    try {
      folders = await apiRequest("GET", "/api/folders");
      if (Array.isArray(folders)) {
        initFolderSelect(folders);
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
      const folderId = selectedFolderId;
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
