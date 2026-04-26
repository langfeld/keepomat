import puppeteerCore from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { existsSync, mkdirSync, statSync } from "fs";
import { resolve } from "path";
import { dismissCookieBanners } from "./cookie-banner";
import { isSafeUrl } from "../utils/url-validation";

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
  // Wichtig für Docker/non-root: explizites User-Data-Verzeichnis
  "--user-data-dir=/tmp/chromium-data",
];

/**
 * Blank-Screenshot-Schwellwert in Bytes.
 * Ein komplett weißer 1280×720 WebP ist ~2 KB, echte Screenshots 30-80+ KB.
 */
const BLANK_SCREENSHOT_THRESHOLD = 10_240; // 10 KB

/**
 * Findet den Chrome/Chromium-Binary-Pfad auf dem System.
 * Prüft zuerst Umgebungsvariable, dann bekannte Pfade, dann which/whereis.
 */
function findChromePath(): string | null {
  // 1. Umgebungsvariable (für Docker/Container)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    if (existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
  }

  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser-puppeteer",
    "/snap/bin/chromium",
    "/usr/local/bin/chrome",
    "/usr/local/bin/chromium",
    // Debian/Ubuntu Chromium (alternative Pfade)
    "/usr/lib/chromium/chromium",
    "/usr/lib/chromium-browser/chromium-browser",
    // Alpine
    "/usr/bin/chromium-browser",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    // Windows (WSL/cross-platform)
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
    "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // 2. which/whereis als Fallback
  try {
    const { execSync } = require("child_process");
    const whichPaths = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
    for (const bin of whichPaths) {
      try {
        const path = execSync(`which ${bin}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
        if (path && existsSync(path)) return path;
      } catch {
        // which nicht gefunden
      }
    }
  } catch {
    // execSync nicht verfügbar
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
  // SSRF-Schutz
  if (!isSafeUrl(url)) {
    console.warn(`⚠️ URL blockiert (SSRF-Schutz): ${url}`);
    return null;
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    console.warn(
      "⚠️ Kein Chrome/Chromium gefunden – Screenshot übersprungen. " +
      "Setze PUPPETEER_EXECUTABLE_PATH oder installiere Chrome/Chromium."
    );
    return null;
  }
  console.log(`🔍 Verwende Chrome/Chromium: ${chromePath}`);

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
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Screenshot fehlgeschlagen für ${url}: ${msg}`);
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Screenshot (Retry) fehlgeschlagen für ${url}: ${msg}`);
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
