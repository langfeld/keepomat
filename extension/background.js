// Keepomat Background Service Worker
// Kontextmenü zum schnellen Speichern

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "keepomat-save",
    title: "In Keepomat speichern",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "keepomat-save") return;

  const url = info.linkUrl || info.pageUrl;
  const title = tab?.title || url;

  const config = await chrome.storage.local.get(["serverUrl", "apiKey"]);
  if (!config.serverUrl || !config.apiKey) {
    // Popup öffnen für Setup
    chrome.action.openPopup();
    return;
  }

  try {
    const res = await fetch(`${config.serverUrl}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify({ url, title }),
    });

    if (res.ok) {
      // Erfolg-Benachrichtigung (Badge)
      chrome.action.setBadgeText({ text: "✓", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
      setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);
    } else {
      chrome.action.setBadgeText({ text: "!", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
      setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);
    }
  } catch (err) {
    console.error("Keepomat save error:", err);
  }
});
