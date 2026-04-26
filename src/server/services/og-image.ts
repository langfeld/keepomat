import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { isSafeUrl } from "../utils/url-validation";

const OG_IMAGES_DIR = resolve(process.cwd(), "data/og-images");

// Verzeichnis erstellen
if (!existsSync(OG_IMAGES_DIR)) {
  mkdirSync(OG_IMAGES_DIR, { recursive: true });
}

/** Mappt Dateiendungen auf MIME-Types */
const EXT_TO_MIME: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("jpg") || contentType.includes("jpeg")) return "jpg";
  return "jpg";
}

/**
 * Gibt den absoluten Pfad zum OG-Image zurück.
 */
export function getOgImagePath(filename: string): string {
  return resolve(OG_IMAGES_DIR, filename);
}

/**
 * Ermittelt den MIME-Type für eine gespeicherte OG-Image-Datei.
 */
export function getOgImageMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  return EXT_TO_MIME[ext] || "image/jpeg";
}

/**
 * Lädt ein OG-Image von einer URL herunter und speichert es lokal.
 * Gibt den Dateinamen zurück oder null bei Fehler.
 */
export async function downloadOgImage(
  url: string,
  bookmarkId: number
): Promise<string | null> {
  // SSRF-Schutz
  if (!isSafeUrl(url)) {
    console.warn(`⚠️ OG-Image URL blockiert (SSRF-Schutz): ${url}`);
    return null;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Keepomat/1.0; +https://github.com/keepomat)",
        Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ OG-Image Download fehlgeschlagen (${response.status}): ${url}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      console.warn(`⚠️ OG-Image hat ungültigen Content-Type (${contentType}): ${url}`);
      return null;
    }

    const ext = getExtensionFromContentType(contentType);
    const filename = `${bookmarkId}.${ext}`;
    const filepath = resolve(OG_IMAGES_DIR, filename);

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(filepath, buffer);

    console.log(`🖼️ OG-Image gespeichert: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
    return filename;
  } catch (error) {
    console.error(`❌ OG-Image Download fehlgeschlagen für ${url}:`, error);
    return null;
  }
}
