# Keepomat 🔖

Smart Bookmark Manager mit AI-gestützter Organisation, Tagging und Volltextsuche.

## Features

- **AI-Tagging & Kategorisierung** – Automatische Tags, Ordnervorschläge und Zusammenfassungen via Moonshot/Kimi
- **Unbegrenzt verschachtelte Ordner** – Organisiere Lesezeichen in beliebig tiefen Ordnerstrukturen
- **Volltextsuche (FTS5)** – Blitzschnelle Suche über Titel, Beschreibungen und Zusammenfassungen
- **Link-Vorschau** – Automatisches Abrufen von OG-Images, Favicons und Metadaten
- **Telegram-Bot** – Links per Chat automatisch als Lesezeichen speichern
- **Browser-Extension** – Chrome/Firefox Extension für schnelles Speichern
- **Import/Export** – Netscape HTML, JSON und PDF Export
- **Geteilte Ordner** – Ordner mit anderen Benutzern teilen
- **Dark/Light Mode** – Automatisch oder manuell umschaltbar
- **Benutzerverwaltung** – Erster Benutzer = Admin, Registrierung steuerbar
- **API-Keys** – Programmatischer Zugriff über API-Schlüssel
- **Dead-Link-Check** – Erkennung toter Links

## Tech-Stack

| Komponente | Technologie |
|------------|-------------|
| Runtime | Bun |
| Backend | Hono |
| Datenbank | SQLite (bun:sqlite) + Drizzle ORM |
| Auth | Better Auth |
| Frontend | Vue 3 + Tailwind CSS 4 |
| State | Pinia |
| AI | OpenAI SDK → Moonshot/Kimi |
| Telegram | grammY |
| PDF | PDFKit |
| Validation | Zod |

## Schnellstart

### Entwicklung

```bash
# Abhängigkeiten installieren
bun install

# Datenbank-Migrationen generieren
bun run db:generate

# Entwicklungsserver starten (Backend + Frontend)
bun run dev
```

Backend: `http://localhost:3000`
Frontend (Vite): `http://localhost:5173`

### Docker

```bash
docker compose up -d
```

Anpassungen in `docker-compose.yml`:
- `BETTER_AUTH_SECRET` – Mindestens 32 Zeichen
- `MOONSHOT_API_KEY` – API-Schlüssel für Moonshot/Kimi AI
- `TELEGRAM_BOT_TOKEN` – Bot-Token von @BotFather
- `PUID/PGID` – Benutzer/Gruppen-ID (Standard: 1000)

Die App ist unter `http://localhost:8080` erreichbar.

## Umgebungsvariablen

| Variable | Beschreibung | Standard |
|----------|-------------|----------|
| `PORT` | Server-Port | `3000` |
| `DATABASE_URL` | SQLite-Datenbankpfad | `./data/keepomat.db` |
| `BETTER_AUTH_SECRET` | Auth-Secret (min. 32 Zeichen) | – |
| `MOONSHOT_API_KEY` | Moonshot/Kimi API-Key | – |
| `AI_MODEL` | AI-Modell | `kimi-k2-turbo-preview` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | – |
| `PUID` | User ID (Docker) | `1000` |
| `PGID` | Group ID (Docker) | `1000` |

## Browser-Extension

1. `chrome://extensions` öffnen
2. Entwicklermodus aktivieren
3. „Entpackte Erweiterung laden" → `extension/` Ordner auswählen
4. Server-URL und API-Schlüssel in der Extension konfigurieren

## API

Alle API-Endpunkte unter `/api/`:
- `POST /api/auth/sign-up/email` – Registrierung
- `POST /api/auth/sign-in/email` – Login
- `GET /api/bookmarks` – Lesezeichen auflisten
- `POST /api/bookmarks` – Lesezeichen erstellen
- `GET /api/folders/tree` – Ordner-Baum
- `GET /api/search?q=...` – Volltextsuche
- `GET /api/export/html` – HTML-Export

Auth via Session-Cookie oder `X-API-Key` Header.

## Lizenz

MIT
