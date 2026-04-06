import ogs from "open-graph-scraper";
import { isSafeUrl } from "../utils/url-validation";

export interface LinkMetadata {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
  siteName: string | null;
}

export async function fetchMetadata(url: string): Promise<LinkMetadata> {
  // SSRF-Schutz
  if (!isSafeUrl(url)) {
    return { title: null, description: null, ogImage: null, favicon: null, siteName: null };
  }

  try {
    const { result } = await ogs({
      url,
      timeout: 10000,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Keepomat/1.0; +https://github.com/keepomat)",
        },
      },
    });

    // Favicon ermitteln
    let favicon: string | null = null;
    if (result.favicon) {
      favicon = result.favicon;
      // Relative Favicon-URLs zu absoluten machen
      if (favicon && !favicon.startsWith("http")) {
        const urlObj = new URL(url);
        favicon = new URL(favicon, urlObj.origin).href;
      }
    } else {
      // Fallback: Standard-Favicon-Pfad
      try {
        const urlObj = new URL(url);
        favicon = `${urlObj.origin}/favicon.ico`;
      } catch {
        favicon = null;
      }
    }

    // OG-Image extrahieren
    let ogImage: string | null = null;
    if (result.ogImage && result.ogImage.length > 0) {
      ogImage = result.ogImage[0]?.url || null;
    }

    return {
      title: result.ogTitle || result.dcTitle || null,
      description:
        result.ogDescription || result.dcDescription || null,
      ogImage,
      favicon,
      siteName: result.ogSiteName || null,
    };
  } catch (error) {
    console.error(`❌ Metadata fetch error for ${url}:`, error);

    // Minimales Fallback
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname,
        description: null,
        ogImage: null,
        favicon: `${urlObj.origin}/favicon.ico`,
        siteName: urlObj.hostname,
      };
    } catch {
      return {
        title: null,
        description: null,
        ogImage: null,
        favicon: null,
        siteName: null,
      };
    }
  }
}

// Link-Erreichbarkeit prüfen (für Dead-Link-Check)
export async function checkLinkAlive(url: string): Promise<boolean> {
  // SSRF-Schutz
  if (!isSafeUrl(url)) return false;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Keepomat/1.0; +https://github.com/keepomat)",
      },
    });
    return response.ok;
  } catch {
    // Bei HEAD-Fehler nochmal mit GET versuchen (manche Server blockieren HEAD)
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Keepomat/1.0; +https://github.com/keepomat)",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
