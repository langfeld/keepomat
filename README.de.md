<p align="center">
  <img src="docs/logo.svg" alt="Keepomat Logo" width="100" />
</p>

<h1 align="center">Keepomat</h1>

<p align="center">
  Smarter Bookmark-Manager mit KI-gestützter Organisation, Tagging und Volltextsuche.
</p>

<p align="center">
  <a href="https://github.com/langfeld/keepomat/actions/workflows/docker.yml"><img src="https://github.com/langfeld/keepomat/actions/workflows/docker.yml/badge.svg" alt="Docker Build" /></a>
  <a href="https://github.com/langfeld/keepomat/pkgs/container/keepomat"><img src="https://img.shields.io/badge/ghcr.io-keepomat-blue?logo=docker" alt="GHCR" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="Lizenz" /></a>
</p>

<p align="center">
  <a href="README.md">🇬🇧 English Version</a>
</p>

---

## Features

- **KI-Tagging & Kategorisierung** — Automatische Tags, Ordnervorschläge und Zusammenfassungen via OpenAI-kompatibler API (Moonshot/Kimi)
- **Unbegrenzt verschachtelte Ordner** — Lesezeichen in beliebig tiefen Ordnerstrukturen organisieren
- **Volltextsuche (FTS5)** — Blitzschnelle Suche über Titel, Beschreibungen und Zusammenfassungen
- **Link-Vorschau** — Automatisches Abrufen von OG-Images, Favicons und Metadaten
- **Telegram-Bot** — Links per Chat automatisch als Lesezeichen speichern
- **Userscript** — Tampermonkey/Violentmonkey Userscript für schnelles Speichern per Tastenkürzel
- **Import/Export** — Netscape HTML, JSON und PDF Export
- **Geteilte Ordner** — Ordner mit anderen Benutzern teilen
- **Dark/Light Mode** — Automatisch oder manuell umschaltbar
- **Benutzerverwaltung** — Erster Benutzer = Admin, Registrierung steuerbar
- **API-Keys** — Programmatischer Zugriff über API-Schlüssel
- **Dead-Link-Check** — Erkennung toter Links
- **Mehrsprachig** — Englische und deutsche Oberfläche

## Tech-Stack

| Komponente | Technologie |
|------------|-------------|
| Runtime | [Bun](https://bun.sh/) |
| Backend | [Hono](https://hono.dev/) |
| Datenbank | SQLite ([bun:sqlite](https://bun.sh/docs/api/sqlite)) + [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | [Better Auth](https://www.better-auth.com/) |
| Frontend | [Vue 3](https://vuejs.org/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| State | [Pinia](https://pinia.vuejs.org/) |
| KI | [OpenAI SDK](https://github.com/openai/openai-node) → Moonshot/Kimi |
| Telegram | [grammY](https://grammy.dev/) |
| PDF | [PDFKit](https://pdfkit.org/) |
| Validierung | [Zod](https://zod.dev/) |

## Schnellstart

### Docker (empfohlen)

#### 1. `docker-compose.yml` erstellen

```yaml
services:
  keepomat:
    image: ghcr.io/langfeld/keepomat:latest
    container_name: keepomat
    restart: unless-stopped
    ports:
      - "8080:3000"
    volumes:
      - ./data:/app/data
    environment:
      - BETTER_AUTH_SECRET=CHANGE_ME       # openssl rand -base64 48
      - BETTER_AUTH_URL=http://localhost:8080
      # - TRUSTED_ORIGINS=http://192.168.1.100  # optional: weitere Origins
      - MOONSHOT_API_KEY=                  # optional: KI-Features
      - AI_MODEL=kimi-k2-turbo-preview
      - TELEGRAM_BOT_TOKEN=               # optional: Telegram-Bot
      - PUID=1000
      - PGID=1000
```

#### 2. Container starten

```bash
docker compose up -d
```

Die App ist unter `http://localhost:8080` erreichbar. Der erste registrierte Benutzer wird automatisch Admin.

#### Konfiguration

| Variable | Beschreibung | Pflicht |
|----------|-------------|--------|
| `BETTER_AUTH_SECRET` | Auth-Secret (min. 32 Zeichen). Generieren: `openssl rand -base64 48` | **Ja** |
| `BETTER_AUTH_URL` | Öffentliche URL der App (wichtig für Cookies) | **Ja** |
| `TRUSTED_ORIGINS` | Zusätzliche Trusted Origins, kommagetrennt (z.B. LAN-IP, weitere Domains) | Nein |
| `MOONSHOT_API_KEY` | API-Schlüssel für [Moonshot/Kimi](https://platform.moonshot.cn/) KI | Nein |
| `AI_MODEL` | Zu verwendendes KI-Modell | Nein |
| `TELEGRAM_BOT_TOKEN` | Bot-Token von [@BotFather](https://t.me/BotFather) | Nein |
| `PUID` / `PGID` | Benutzer-/Gruppen-ID für Dateiberechtigungen (Standard: 1000) | Nein |

#### Alternative: `docker run`

```bash
docker run -d \
  --name keepomat \
  --restart unless-stopped \
  -p 8080:3000 \
  -v ./data:/app/data \
  -e BETTER_AUTH_SECRET=$(openssl rand -base64 48) \
  -e BETTER_AUTH_URL=http://localhost:8080 \
  ghcr.io/langfeld/keepomat:latest
```

#### Updates

```bash
docker compose pull
docker compose up -d
```

#### Datenpersistenz

Alle Daten (SQLite-Datenbank, Screenshots) werden im `./data`-Volume gespeichert. Sichere dieses Verzeichnis, um deine Lesezeichen zu erhalten.

#### LAN- / Multi-Device-Zugriff

Wenn du Keepomat von anderen Geräten im lokalen Netzwerk erreichst (z.B. `http://192.168.1.100:8080`), füge die LAN-URL zu `TRUSTED_ORIGINS` hinzu:

```yaml
- TRUSTED_ORIGINS=http://192.168.1.100:8080
```

Mehrere Origins können kommagetrennt angegeben werden: `http://192.168.1.100:8080,http://10.0.0.5:8080`

#### Reverse Proxy

Bei Betrieb hinter einem Reverse Proxy (Nginx, Caddy, Traefik) muss `BETTER_AUTH_URL` auf die öffentliche URL gesetzt werden (z.B. `https://bookmarks.example.com`). Der Container exponiert intern Port `3000`.

### Entwicklung

```bash
# Abhängigkeiten installieren
bun install

# Datenbank-Migrationen generieren
bun run db:generate

# Entwicklungsserver starten (Backend + Frontend)
bun run dev
```

- Backend: `http://localhost:3000`
- Frontend (Vite): `http://localhost:5173`

## Umgebungsvariablen

| Variable | Beschreibung | Standard |
|----------|-------------|----------|
| `PORT` | Server-Port | `3000` |
| `DATABASE_URL` | SQLite-Datenbankpfad | `./data/keepomat.db` |
| `BETTER_AUTH_SECRET` | Auth-Secret (min. 32 Zeichen) | — |
| `BETTER_AUTH_URL` | Basis-URL | `http://localhost:3000` |
| `TRUSTED_ORIGINS` | Zusätzliche Trusted Origins (kommagetrennt) | — |
| `MOONSHOT_API_KEY` | Moonshot/Kimi API-Key | — |
| `AI_MODEL` | KI-Modell | `kimi-k2-turbo-preview` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | — |
| `PUID` | User ID (Docker) | `1000` |
| `PGID` | Group ID (Docker) | `1000` |

## Userscript

1. Userscript-Manager installieren (z.B. [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/))
2. Userscript über `https://<deine-url>/keepomat.user.js` installieren
3. Auf einer beliebigen Webseite den 🔖-Button klicken oder `Alt+K` drücken
4. Beim ersten Mal Server-URL und API-Schlüssel eingeben

## API

Alle API-Endpunkte unter `/api/`:

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| `POST` | `/api/auth/sign-up/email` | Registrierung |
| `POST` | `/api/auth/sign-in/email` | Login |
| `GET` | `/api/bookmarks` | Lesezeichen auflisten |
| `POST` | `/api/bookmarks` | Lesezeichen erstellen |
| `GET` | `/api/folders/tree` | Ordner-Baum |
| `GET` | `/api/search?q=...` | Volltextsuche |
| `GET` | `/api/export/html` | HTML-Export |
| `GET` | `/api/health` | Health-Check |

Authentifizierung via Session-Cookie oder `X-API-Key` / `Authorization: Bearer <key>` Header.

## Projektstruktur

```
src/
├── server/          # Hono Backend (API)
│   ├── routes/      # API-Routen
│   ├── services/    # Business-Logik (KI, Metadaten, Screenshots)
│   ├── middleware/   # Auth-Guards
│   └── utils/       # Hilfsfunktionen
├── frontend/        # Vue 3 SPA
│   ├── views/       # Seiten
│   ├── components/  # Wiederverwendbare Komponenten
│   ├── stores/      # Pinia Stores
│   ├── composables/ # Vue Composables
│   ├── i18n/        # Übersetzungen (en, de)
│   └── router/      # Vue Router
├── db/              # Drizzle ORM (Schema, Migrationen)
├── bot/             # Telegram Bot (grammY)
└── shared/          # Geteilte Types & Validatoren
```

## Lizenz

[MIT](LICENSE)
