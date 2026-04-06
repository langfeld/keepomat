import type { Page, Frame } from "puppeteer-core";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";

// ── Bekannte CMP-Framework-Selektoren ──

/** CSS-Selektoren für "Akzeptieren"-Buttons gängiger Consent-Management-Plattformen */
const BUILT_IN_ACCEPT_SELECTORS = [
  // === OneTrust ===
  "#onetrust-accept-btn-handler",
  ".onetrust-close-btn-handler",

  // === Cookiebot ===
  "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  "#CybotCookiebotDialogBodyButtonAccept",
  "#CybotCookiebotDialogBodyLevelButtonAccept",
  'a[data-cookieconsent="accept"]',

  // === Didomi ===
  "#didomi-notice-agree-button",
  ".didomi-continue-without-agreeing",

  // === Usercentrics ===
  '[data-testid="uc-accept-all-button"]',

  // === Quantcast / TCF ===
  ".qc-cmp2-summary-buttons button[mode='primary']",
  'button.css-47sehv', // Quantcast generisch

  // === Klaro ===
  "button.cm-btn-accept",
  "button.cm-btn-accept-all",
  ".klaro .cm-btn-success",

  // === Consent Manager ===
  ".cmpboxbtn.cmpboxbtnyes",
  "#cmpbox .cmpboxbtnyes",
  "#cmpwrapper .cmpboxbtnyes",

  // === Sourcepoint ===
  // Sourcepoint-Buttons sind meist in iframes – werden über Iframe-Traversal gefunden.
  // Hier Selektoren für eingebettete Varianten:
  'button.accept-all',
  'button[class*="sp_choice_type"][class*="accept"]',
  'button[title="Einwilligen und weiter"]',
  'button[title="Accept all"]',
  'button[title="Alle akzeptieren"]',

  // === Evidon / Crownpeak ===
  ".evidon-banner-acceptbutton",
  "#_evidon_banner .evidon-banner-acceptbutton",

  // === TrustArc / TrustE ===
  ".trustarc-agree-btn",
  "#truste-consent-button",
  "#consent_wall_optin",

  // === Borlabs Cookie (WordPress) ===
  "#CookieBoxSaveButton",
  'a[data-cookie-accept]',
  "#BorlabsCookieBoxWrap .cookie-accept",
  "._brlbs-btn-accept-all",

  // === Complianz (WordPress) ===
  ".cmplz-accept",
  ".cmplz-btn.cmplz-accept",

  // === GDPR Cookie Consent (WordPress) ===
  "#cookie_action_close_header",
  ".cli-plugin-button.cli_action_button",

  // === Iubenda ===
  ".iubenda-cs-accept-btn",
  "#iubenda-cs-banner .iubenda-cs-accept-btn",

  // === Osano ===
  ".osano-cm-accept-all",
  ".osano-cm-dialog__button--type_accept",

  // === Cookie Notice (WordPress) ===
  "#cn-accept-cookie",
  ".cn-set-cookie",

  // === Generische Patterns ===
  'button[id*="accept"]', 'button[id*="Accept"]',
  'button[id*="agree"]', 'button[id*="Agree"]',
  'button[id*="consent"]', 'button[id*="Consent"]',
  'a[id*="accept"]', 'a[id*="Accept"]',
  'button[class*="accept"]', 'button[class*="consent"]',
  'button[class*="agree"]', 'button[class*="cookie-accept"]',
  '.cookie-accept', '.cookie-consent-accept',
  '.cc-accept', '.cc-allow', '.cc-dismiss',
  '[data-cookieconsent="accept"]',
  '[data-action="accept"]',
  'button[aria-label*="accept" i]',
  'button[aria-label*="akzeptieren" i]',
  'button[aria-label*="zustimmen" i]',
  'button[aria-label*="Allow" i]',
  'button[aria-label*="agree" i]',
];

/** Text-Schlüsselwörter für Akzeptieren-Buttons (Kleinbuchstaben, Prioritätsreihenfolge) */
const ACCEPT_KEYWORDS = [
  // Deutsch – spezifisch zuerst
  "alle akzeptieren",
  "alle cookies akzeptieren",
  "einwilligen und weiter",
  "alles akzeptieren",
  "akzeptieren und weiter",
  "akzeptieren & weiter",
  "zustimmen und weiter",
  "cookies akzeptieren",
  "akzeptieren",
  "zustimmen",
  "einverstanden",
  "einwilligen",
  "ich stimme zu",
  "alles klar",
  "verstanden",

  // Englisch – spezifisch zuerst
  "accept all cookies",
  "accept all",
  "allow all cookies",
  "allow all",
  "agree to all",
  "accept cookies",
  "accept",
  "agree",
  "allow",
  "got it",
  "i agree",
  "i understand",

  // Französisch
  "tout accepter",
  "accepter tout",
  "accepter",
  "j'accepte",

  // Spanisch
  "aceptar todo",
  "aceptar todas",
  "aceptar",

  // Niederländisch
  "alles accepteren",
  "accepteren",

  // Italienisch
  "accetta tutto",
  "accetta tutti",
  "accetta",
];

/** Selektoren für bekannte Consent-Iframes */
const CMP_IFRAME_SELECTORS = [
  // Sourcepoint
  'iframe[id^="sp_message_iframe"]',
  'iframe[title="SP Consent Message"]',
  // Didomi
  'iframe#didomi-consent-popup',
  // Generisch
  'iframe[id*="consent"]',
  'iframe[id*="cookie"]',
  'iframe[title*="consent" i]',
  'iframe[title*="cookie" i]',
  'iframe[title*="Privacy" i]',
  'iframe[title*="GDPR" i]',
  'iframe[title*="Datenschutz" i]',
];

/** Selektoren für Overlay-Container, die nach dem Klick entfernt werden sollen */
const OVERLAY_SELECTORS = [
  "#onetrust-banner-sdk", "#onetrust-consent-sdk",
  "#CybotCookiebotDialog", "#cookie-banner", "#cookie-consent",
  ".cookie-banner", ".cookie-consent", ".cookie-notice",
  ".cc-window", ".cc-banner", "#didomi-host",
  ".evidon-consent-container", "#usercentrics-root",
  '[class*="cookie-overlay"]', '[class*="consent-overlay"]',
  '[id*="cookie-banner"]', '[id*="cookie-notice"]',
  '[id*="gdpr"]', '[class*="gdpr"]',
  // Sourcepoint
  ".sp-message-open", '[id^="sp_message_container"]',
  // Klaro
  ".klaro", "#klaro",
  // Borlabs
  "#CookieBoxTextHeadline",
  // Consent Manager
  "#cmpbox", "#cmpbox2", "#cmpwrapper",
];

// ── Hilfsfunktionen ──

/** Lädt benutzerdefinierte Selektoren aus der Datenbank (Admin-konfigurierbar) */
function getCustomSelectors(): string[] {
  try {
    const setting = db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, "cookie_banner_selectors"))
      .get();

    if (!setting?.value) return [];

    // Format: Ein Selektor pro Zeile
    return setting.value
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("#")); // Kommentare ignorieren
  } catch {
    return [];
  }
}

// ── Hauptfunktion ──

/**
 * Versucht Cookie-Banner/Consent-Overlays zu schließen.
 * Unterstützt:
 * - Gängige CMP-Frameworks (OneTrust, Cookiebot, Sourcepoint, Didomi, etc.)
 * - iframe-basierte Consent-Dialoge (z.B. Sourcepoint auf spiegel.de)
 * - Text-basierte Button-Suche (DE/EN/FR/ES/NL/IT)
 * - Admin-konfigurierbare zusätzliche Selektoren
 * - Overlay-Entfernung als Fallback
 */
export async function dismissCookieBanners(page: Page): Promise<void> {
  try {
    // Admin-konfigurierte Selektoren laden
    const customSelectors = getCustomSelectors();
    const allSelectors = [...customSelectors, ...BUILT_IN_ACCEPT_SELECTORS];

    // 1. Versuch: CSS-Selektoren im Hauptframe
    const clickedMain = await tryClickSelectors(page, allSelectors);
    if (clickedMain) {
      await waitAfterClick(page);
      return;
    }

    // 2. Versuch: In iframes suchen (Priorität vor Text-Suche, da CMPs wie
    //    Sourcepoint ihre Buttons in iframes rendern und Text-Suche im
    //    Hauptframe generische Buttons fälschlich klicken kann)
    const clickedIframe = await tryClickInIframes(page, allSelectors);
    if (clickedIframe) {
      await waitAfterClick(page);
      return;
    }

    // 3. Versuch: Text-basierte Suche im Hauptframe
    const clickedText = await tryClickByText(page);
    if (clickedText) {
      await waitAfterClick(page);
      return;
    }

    // 4. Fallback: Overlay-Elemente per CSS ausblenden
    await removeOverlays(page);
  } catch (error) {
    // Cookie-Banner-Dismissal ist optional – Fehler ignorieren
    console.debug("Cookie-Banner konnte nicht geschlossen werden:", error);
  }
}

/** Versucht einen der CSS-Selektoren zu klicken */
async function tryClickSelectors(context: Page | Frame, selectors: string[]): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const btn = await context.$(selector);
      if (btn) {
        const isVisible = await btn.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== "none"
            && style.visibility !== "hidden"
            && style.opacity !== "0"
            && el.offsetWidth > 0
            && el.offsetHeight > 0;
        });
        if (isVisible) {
          await btn.click();
          return true;
        }
      }
    } catch {
      // Selektor nicht gefunden oder Klick fehlgeschlagen – weiter
    }
  }
  return false;
}

/** Sucht Buttons anhand von Text-Schlüsselwörtern */
async function tryClickByText(context: Page | Frame): Promise<boolean> {
  try {
    return await context.evaluate((keywords: string[]) => {
      const buttons = Array.from(
        document.querySelectorAll('button, a[role="button"], [role="button"], a.btn, a.button, input[type="submit"]')
      );
      for (const kw of keywords) {
        for (const btn of buttons) {
          const el = btn as HTMLElement;
          const text = el.innerText?.toLowerCase().trim();
          if (!text) continue;
          if (text === kw || text.startsWith(kw)) {
            const style = window.getComputedStyle(el);
            if (style.display !== "none" && style.visibility !== "hidden") {
              el.click();
              return true;
            }
          }
        }
      }
      return false;
    }, ACCEPT_KEYWORDS);
  } catch {
    return false;
  }
}

/** Durchsucht alle iframes nach Consent-Buttons */
async function tryClickInIframes(page: Page, selectors: string[]): Promise<boolean> {
  try {
    // Zuerst bekannte CMP-Iframes suchen
    for (const iframeSel of CMP_IFRAME_SELECTORS) {
      try {
        const iframeHandle = await page.$(iframeSel);
        if (!iframeHandle) continue;

        const frame = await iframeHandle.contentFrame();
        if (!frame) continue;

        // CSS-Selektoren im iframe
        const clicked = await tryClickSelectors(frame, selectors);
        if (clicked) return true;

        // Text-basierte Suche im iframe
        const clickedText = await tryClickByText(frame);
        if (clickedText) return true;
      } catch {
        // iframe-Zugriff evtl. blockiert (Cross-Origin) – weiter
      }
    }

    // Dann alle Frames der Seite durchgehen (Puppeteer frames() API)
    const frames = page.frames();
    for (const frame of frames) {
      if (frame === page.mainFrame()) continue; // Hauptframe überspringen

      try {
        // Prüfen ob der Frame überhaupt consent-relevant sein könnte
        const frameUrl = frame.url();
        const isConsentFrame = /consent|privacy|cookie|gdpr|cmp|sourcepoint|sp_message|didomi|onetrust/i.test(frameUrl);

        if (!isConsentFrame) continue;

        // CSS-Selektoren im iframe
        const clicked = await tryClickSelectors(frame, selectors);
        if (clicked) return true;

        // Text-basierte Suche im iframe
        const clickedText = await tryClickByText(frame);
        if (clickedText) return true;
      } catch {
        // Frame-Zugriff fehlgeschlagen – weiter
      }
    }
  } catch (error) {
    console.debug("Iframe-Traversal fehlgeschlagen:", error);
  }

  return false;
}

/** Entfernt Overlay-Elemente und stellt den Body-Scroll wieder her */
async function removeOverlays(page: Page): Promise<void> {
  await page.evaluate((overlaySelectors: string[]) => {
    // Bekannte Overlay-Container ausblenden
    for (const sel of overlaySelectors) {
      document.querySelectorAll(sel).forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
    }

    // Generische fixed/fullscreen Overlays mit hohem z-index entfernen
    document.querySelectorAll('[class*="overlay"], [class*="backdrop"], [class*="modal-backdrop"]').forEach((el) => {
      const style = window.getComputedStyle(el as HTMLElement);
      if (style.position === "fixed" && parseFloat(style.zIndex) > 999) {
        (el as HTMLElement).style.display = "none";
      }
    });

    // Shadow DOMs durchsuchen (Usercentrics u.a.)
    document.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        el.shadowRoot.querySelectorAll('[class*="overlay"], [class*="backdrop"]').forEach((shadowEl) => {
          const style = window.getComputedStyle(shadowEl as HTMLElement);
          if (style.position === "fixed" && parseFloat(style.zIndex) > 999) {
            (shadowEl as HTMLElement).style.display = "none";
          }
        });
      }
    });

    // Body-Scroll wiederherstellen (mit !important um CSS-Klassen zu überschreiben)
    document.body?.style?.setProperty("overflow", "visible", "important");
    document.documentElement?.style?.setProperty("overflow", "visible", "important");
    document.body?.classList?.remove("sp-message-open", "modal-open", "no-scroll", "cookie-open");
  }, OVERLAY_SELECTORS);
}

/** Kurz warten nach Klick, damit die Seite reagieren kann */
async function waitAfterClick(page: Page): Promise<void> {
  await new Promise((r) => setTimeout(r, 800));

  // Nach dem Klick evtl. verbleibende Overlays entfernen
  await removeOverlays(page);
}
