/**
 * URL-Validierung gegen SSRF-Angriffe.
 * Verhindert Zugriff auf interne Netzwerke, Localhost und gefährliche Schemata.
 */

/** IP-Bereiche die blockiert werden (private/interne Netzwerke) */
const BLOCKED_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local (AWS Metadata etc.)
  /^0\./,                      // "This" network
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // Shared address space (CGN)
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 ULA
  /^fe80:/i,                   // IPv6 link-local
  /^fd/i,                      // IPv6 private
];

/** Blockierte Hostnamen */
const BLOCKED_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  "[::1]",
  "metadata.google.internal",
  "metadata.google.com",
];

/** Erlaubte URL-Schemata */
const ALLOWED_SCHEMES = ["http:", "https:"];

/**
 * Prüft ob eine URL sicher für serverseitige Requests ist (kein SSRF-Risiko).
 * Gibt true zurück wenn die URL sicher ist, false wenn sie blockiert werden soll.
 */
export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Nur http/https erlauben
    if (!ALLOWED_SCHEMES.includes(url.protocol)) {
      return false;
    }

    // Blockierte Hostnamen prüfen
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    // IP-Adressen gegen blockierte Bereiche prüfen
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Port 0 blockieren
    if (url.port === "0") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validiert eine URL und gibt einen Fehlerstring zurück, oder null wenn OK.
 */
export function validateUrlForFetch(urlString: string): string | null {
  try {
    new URL(urlString);
  } catch {
    return "Ungültige URL";
  }

  if (!isSafeUrl(urlString)) {
    return "URL verweist auf ein internes oder nicht erlaubtes Netzwerk";
  }

  return null;
}
