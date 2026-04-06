import puppeteer from "puppeteer-core";
import type { Page } from "puppeteer-core";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const SCREENSHOTS_DIR = resolve(process.cwd(), "data/screenshots");

// Verzeichnis erstellen
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Findet den Chrome/Chromium-Binary-Pfad auf dem System.
 */
function findChromePath(): string | null {
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Versucht Cookie-Banner/Consent-Overlays zu schließen.
 * Klickt auf gängige "Akzeptieren"-Buttons und entfernt bekannte Overlay-Elemente.
 */
async function dismissCookieBanners(page: Page): Promise<void> {
  try {
    // Gängige Selektoren für "Akzeptieren"-Buttons in Cookie-Bannern
    const acceptSelectors = [
      // Text-basierte Buttons (deutsch + englisch)
      'button[id*="accept"]', 'button[id*="Accept"]',
      'button[id*="agree"]', 'button[id*="Agree"]',
      'button[id*="consent"]', 'button[id*="Consent"]',
      'a[id*="accept"]', 'a[id*="Accept"]',
      // Klassen-basierte Buttons
      'button[class*="accept"]', 'button[class*="consent"]',
      'button[class*="agree"]', 'button[class*="cookie-accept"]',
      '.cookie-accept', '.cookie-consent-accept',
      '.cc-accept', '.cc-allow', '.cc-dismiss',
      // CMP-Frameworks (OneTrust, Cookiebot, etc.)
      '#onetrust-accept-btn-handler',
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
      '#CybotCookiebotDialogBodyButtonAccept',
      '.cmpboxbtn.cmpboxbtnyes',
      '#didomi-notice-agree-button',
      '.evidon-banner-acceptbutton',
      '[data-cookieconsent="accept"]',
      '[data-action="accept"]',
      // Generische Patterns
      'button[aria-label*="accept" i]',
      'button[aria-label*="akzeptieren" i]',
      'button[aria-label*="zustimmen" i]',
      'button[aria-label*="Allow" i]',
      'button[aria-label*="agree" i]',
    ];

    // Versuche Buttons zu klicken
    for (const selector of acceptSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          const isVisible = await btn.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
          if (isVisible) {
            await btn.click();
            await new Promise((r) => setTimeout(r, 500));
            return; // Erster erfolgreicher Klick reicht
          }
        }
      } catch {}
    }

    // Fallback: Text-basierte Suche nach Buttons mit "Akzeptieren", "Accept", "Alle akzeptieren" etc.
    const clicked = await page.evaluate(() => {
      const keywords = [
        'alle akzeptieren', 'akzeptieren', 'accept all', 'accept',
        'agree', 'allow all', 'allow', 'zustimmen', 'einverstanden',
        'got it', 'ok', 'ich stimme zu', 'alles klar', 'verstanden',
      ];
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"], [role="button"]'));
      for (const kw of keywords) {
        for (const btn of buttons) {
          const text = (btn as HTMLElement).innerText?.toLowerCase().trim();
          if (text === kw || text?.startsWith(kw)) {
            const style = window.getComputedStyle(btn as HTMLElement);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              (btn as HTMLElement).click();
              return true;
            }
          }
        }
      }
      return false;
    });

    if (clicked) {
      await new Promise((r) => setTimeout(r, 500));
      return;
    }

    // Letzter Fallback: Bekannte Overlay-Container per CSS entfernen
    await page.evaluate(() => {
      const overlaySelectors = [
        '#onetrust-banner-sdk', '#onetrust-consent-sdk',
        '#CybotCookiebotDialog', '#cookie-banner', '#cookie-consent',
        '.cookie-banner', '.cookie-consent', '.cookie-notice',
        '.cc-window', '.cc-banner', '#didomi-host',
        '.evidon-consent-container', '#usercentrics-root',
        '[class*="cookie-overlay"]', '[class*="consent-overlay"]',
        '[id*="cookie-banner"]', '[id*="cookie-notice"]',
        '[id*="gdpr"]', '[class*="gdpr"]',
      ];
      for (const sel of overlaySelectors) {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }
      // Backdrop/Overlay-Layer entfernen
      document.querySelectorAll('[class*="overlay"]').forEach((el) => {
        const style = window.getComputedStyle(el as HTMLElement);
        if (style.position === 'fixed' && parseFloat(style.zIndex) > 999) {
          (el as HTMLElement).style.display = 'none';
        }
      });
      // Body-Scroll wiederherstellen
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    });
  } catch (error) {
    // Cookie-Banner-Dismissal ist optional – Fehler ignorieren
    console.debug("Cookie-Banner konnte nicht geschlossen werden:", error);
  }
}

/**
 * Screenshot einer URL erstellen und als Datei speichern.
 * Gibt den Dateinamen zurück oder null bei Fehler.
 */
export async function captureScreenshot(
  url: string,
  bookmarkId: number
): Promise<string | null> {
  const chromePath = findChromePath();
  if (!chromePath) {
    console.warn("⚠️ Kein Chrome/Chromium gefunden – Screenshot übersprungen");
    return null;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--no-first-run",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    // Cookie-Banner erkennen und wegklicken
    await dismissCookieBanners(page);

    // Kurz warten damit Lazy-Loading-Bilder etc. laden
    await new Promise((r) => setTimeout(r, 1000));

    const filename = `${bookmarkId}.webp`;
    const filepath = resolve(SCREENSHOTS_DIR, filename);

    await page.screenshot({
      path: filepath,
      type: "webp",
      quality: 80,
    });

    console.log(`📸 Screenshot erstellt: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Screenshot fehlgeschlagen für ${url}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Gibt den absoluten Pfad zum Screenshot zurück.
 */
export function getScreenshotPath(filename: string): string {
  return resolve(SCREENSHOTS_DIR, filename);
}
