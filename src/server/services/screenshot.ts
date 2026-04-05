import puppeteer from "puppeteer-core";
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
