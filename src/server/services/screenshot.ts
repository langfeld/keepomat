import puppeteerCore from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { existsSync, mkdirSync, statSync } from "fs";
import { resolve } from "path";
import { dismissCookieBanners } from "./cookie-banner";

// puppeteer-extra mit Adblocker-Plugin (blockiert Cookie-Banner via Filterlisten)
const puppeteer = addExtra(puppeteerCore as any);
puppeteer.use(
  AdblockerPlugin({
    blockTrackers: true,
    blockTrackersAndAnnoyances: true, // Cookie-Banner, Newsletter-Popups etc.
  })
);

const SCREENSHOTS_DIR = resolve(process.cwd(), "data/screenshots");

// Verzeichnis erstellen
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/** Gemeinsame Browser-Argumente */
const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--no-first-run",
];

/**
 * Blank-Screenshot-Schwellwert in Bytes.
 * Ein komplett weißer 1280×720 WebP ist ~2 KB, echte Screenshots 30-80+ KB.
 */
const BLANK_SCREENSHOT_THRESHOLD = 10_240; // 10 KB

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
 * Screenshot einer URL erstellen und als Datei speichern.
 * Gibt den Dateinamen zurück oder null bei Fehler.
 *
 * Strategie:
 * 1. Mit Adblocker (blockiert ~95% der Cookie-Banner via Filterlisten)
 * 2. Screenshot-Dateigröße prüfen – blank WebP (~2 KB) erkennt Consent Walls
 * 3. Falls blank → Retry ohne Adblocker, Consent manuell akzeptieren
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

  const filename = `${bookmarkId}.webp`;
  const filepath = resolve(SCREENSHOTS_DIR, filename);

  // 1. Versuch: Mit Adblocker (primäre Strategie)
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: BROWSER_ARGS,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    // Kurz warten damit asynchrone Consent-Dialoge (Sourcepoint etc.) laden
    await new Promise((r) => setTimeout(r, 500));

    // 1. Dismiss-Versuch: Cookie-Banner erkennen und wegklicken
    await dismissCookieBanners(page);

    // Warten damit Lazy-Loading-Bilder etc. laden
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Dismiss-Versuch: Falls der Dialog erst nach dem ersten Versuch erschien
    await dismissCookieBanners(page);

    await page.screenshot({
      path: filepath,
      type: "webp",
      quality: 80,
    });

    await browser.close().catch(() => {});
    browser = null;

    // Consent-Wall-Erkennung anhand der Dateigröße:
    // Blank/weiße Screenshots (Consent Wall) ≈ 2 KB, echte Screenshots 30-80+ KB
    const fileSize = statSync(filepath).size;
    if (fileSize < BLANK_SCREENSHOT_THRESHOLD) {
      console.log(
        `🔄 Blank-Screenshot erkannt (${Math.round(fileSize / 1024)} KB) bei ${url} – Retry ohne Adblocker`
      );
      return await captureWithoutAdblocker(url, filepath, filename, chromePath);
    }

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
 * Erstellt Screenshot ohne Adblocker – für Seiten mit Consent Walls.
 * Der Consent-Dialog wird stattdessen manuell über cookie-banner.ts akzeptiert.
 */
async function captureWithoutAdblocker(
  url: string,
  filepath: string,
  filename: string,
  chromePath: string
): Promise<string | null> {
  let browser;
  try {
    // puppeteer-core direkt verwenden (ohne Adblocker-Plugin)
    browser = await puppeteerCore.launch({
      executablePath: chromePath,
      headless: true,
      args: BROWSER_ARGS,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    // Warten damit der Consent-Dialog (Sourcepoint etc.) vollständig lädt
    await new Promise((r) => setTimeout(r, 2000));

    // Cookie-Banner manuell akzeptieren (hier ist er sichtbar da nicht geblockt)
    await dismissCookieBanners(page);

    // Warten – nach Consent-Akzeptanz muss die Seite Content nachladen
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({
      path: filepath,
      type: "webp",
      quality: 80,
    });

    console.log(`📸 Screenshot erstellt (Consent-Wall-Retry): ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Screenshot (Retry) fehlgeschlagen für ${url}:`, error);
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
