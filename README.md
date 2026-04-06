<p align="center">
  <img src="docs/logo.svg" alt="Keepomat Logo" width="100" />
</p>

<h1 align="center">Keepomat</h1>

<p align="center">
  Smart Bookmark Manager with AI-powered organization, tagging and full-text search.
</p>

<p align="center">
  <a href="https://github.com/langfeld/keepomat/actions/workflows/docker.yml"><img src="https://github.com/langfeld/keepomat/actions/workflows/docker.yml/badge.svg" alt="Docker Build" /></a>
  <a href="https://github.com/langfeld/keepomat/pkgs/container/keepomat"><img src="https://img.shields.io/badge/ghcr.io-keepomat-blue?logo=docker" alt="GHCR" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
</p>

<p align="center">
  <a href="README.de.md">🇩🇪 Deutsche Version</a>
</p>

---

## Features

- **AI Tagging & Categorization** — Automatic tags, folder suggestions and summaries via OpenAI-compatible API (Moonshot/Kimi)
- **Unlimited nested folders** — Organize bookmarks in arbitrarily deep folder structures
- **Full-text search (FTS5)** — Blazing-fast search across titles, descriptions and summaries
- **Link previews** — Automatic fetching of OG images, favicons and metadata
- **Telegram Bot** — Save links as bookmarks directly from chat
- **Userscript** — Tampermonkey/Violentmonkey userscript for quick saving via keyboard shortcut
- **Import/Export** — Netscape HTML, JSON and PDF export
- **Shared folders** — Share folders with other users
- **Dark/Light Mode** — Automatic or manual toggle
- **User management** — First user = admin, controllable registration
- **API keys** — Programmatic access via API keys
- **Dead link check** — Detection of broken links
- **Multi-language** — English and German UI

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | [Bun](https://bun.sh/) |
| Backend | [Hono](https://hono.dev/) |
| Database | SQLite ([bun:sqlite](https://bun.sh/docs/api/sqlite)) + [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | [Better Auth](https://www.better-auth.com/) |
| Frontend | [Vue 3](https://vuejs.org/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| State | [Pinia](https://pinia.vuejs.org/) |
| AI | [OpenAI SDK](https://github.com/openai/openai-node) → Moonshot/Kimi |
| Telegram | [grammY](https://grammy.dev/) |
| PDF | [PDFKit](https://pdfkit.org/) |
| Validation | [Zod](https://zod.dev/) |

## Quick Start

### Docker (recommended)

#### 1. Create a `docker-compose.yml`

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    # For LAN access: set CADDY_HOST to your LAN IP
    # environment:
    #   - CADDY_HOST=192.168.1.100
    depends_on:
      - keepomat

  keepomat:
    image: ghcr.io/langfeld/keepomat:latest
    container_name: keepomat
    restart: unless-stopped
    expose:
      - "3000"
    volumes:
      - ./data:/app/data
    environment:
      - BETTER_AUTH_SECRET=CHANGE_ME       # openssl rand -base64 48
      - BETTER_AUTH_URL=https://localhost
      # - TRUSTED_ORIGINS=https://bookmarks.example.com  # optional: Pangolin domain
      - MOONSHOT_API_KEY=                  # optional: AI features
      - AI_MODEL=kimi-k2-turbo-preview
      - TELEGRAM_BOT_TOKEN=               # optional: Telegram bot
      - PUID=1000
      - PGID=1000

volumes:
  caddy_data:
  caddy_config:
```

You also need a `Caddyfile` in the same directory:

```caddyfile
{$CADDY_HOST:localhost} {
	tls internal
	reverse_proxy keepomat:3000
}
```

Caddy automatically generates a self-signed certificate. Accept it once in the browser, or install Caddy's root CA on your devices (see [LAN Access](#lan--multi-device-access)).

#### 2. Start the container

```bash
docker compose up -d
```

The app will be available at `https://localhost`. The first registered user automatically becomes admin.

> **Without Caddy:** Remove the `caddy` service, replace `expose` with `ports: ["8080:3000"]`, and set `BETTER_AUTH_URL=http://localhost:8080`.

#### Configuration

| Variable | Description | Required |
|----------|------------|----------|
| `BETTER_AUTH_SECRET` | Auth secret (min. 32 chars). Generate: `openssl rand -base64 48` | **Yes** |
| `BETTER_AUTH_URL` | Public URL of the app (important for cookies) | **Yes** |
| `TRUSTED_ORIGINS` | Additional trusted origins, comma-separated (e.g. Pangolin domain) | No |
| `MOONSHOT_API_KEY` | API key for [Moonshot/Kimi](https://platform.moonshot.cn/) AI | No |
| `AI_MODEL` | AI model to use | No |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) | No |
| `PUID` / `PGID` | User/Group ID for file permissions (default: 1000) | No |

#### Alternative: `docker run` (without Caddy)

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

#### Data persistence

All data (SQLite database, screenshots) is stored in the `./data` volume. Back up this directory to preserve your bookmarks.

#### LAN / Multi-Device Access

To access Keepomat from other devices in your LAN, set `CADDY_HOST` to your LAN IP and adjust `BETTER_AUTH_URL`:

```yaml
# In docker-compose.yml:
caddy:
  environment:
    - CADDY_HOST=192.168.1.100

keepomat:
  environment:
    - BETTER_AUTH_URL=https://192.168.1.100
    - TRUSTED_ORIGINS=https://bookmarks.example.com  # external domain (e.g. Pangolin)
```

The `Caddyfile` does not need to be modified – it uses `CADDY_HOST` automatically.

**Avoid browser warnings:** Install Caddy's root CA certificate on your devices:

```bash
# Copy the root CA from the Caddy container:
docker cp keepomat-caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root-ca.crt
```

Then install `caddy-root-ca.crt` as a trusted certificate on your devices (system settings → certificates).

#### Reverse proxy

If you already use an external reverse proxy (Nginx, Traefik, Pangolin), you can bypass Caddy and expose the port directly:

```yaml
# Remove the caddy service and replace expose with:
ports:
  - "8080:3000"
```

Set `BETTER_AUTH_URL` to your public URL (e.g. `https://bookmarks.example.com`).

### Development

```bash
# Install dependencies
bun install

# Run database migrations
bun run db:generate

# Start development server (backend + frontend)
bun run dev
```

- Backend: `http://localhost:3000`
- Frontend (Vite): `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | SQLite database path | `./data/keepomat.db` |
| `BETTER_AUTH_SECRET` | Auth secret (min. 32 chars) | — |
| `BETTER_AUTH_URL` | Base URL | `http://localhost:3000` |
| `TRUSTED_ORIGINS` | Additional trusted origins (comma-separated) | — |
| `MOONSHOT_API_KEY` | Moonshot/Kimi API key | — |
| `AI_MODEL` | AI model | `kimi-k2-turbo-preview` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | — |
| `PUID` | User ID (Docker) | `1000` |
| `PGID` | Group ID (Docker) | `1000` |

## Userscript

1. Install a userscript manager (e.g. [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/))
2. Install the userscript via `https://<your-url>/keepomat.user.js`
3. Click the 🔖 button on any webpage or press `Alt+K`
4. Enter server URL and API key on first use

## API

All API endpoints under `/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/sign-up/email` | Register |
| `POST` | `/api/auth/sign-in/email` | Login |
| `GET` | `/api/bookmarks` | List bookmarks |
| `POST` | `/api/bookmarks` | Create bookmark |
| `GET` | `/api/folders/tree` | Folder tree |
| `GET` | `/api/search?q=...` | Full-text search |
| `GET` | `/api/export/html` | HTML export |
| `GET` | `/api/health` | Health check |

Authentication via session cookie or `X-API-Key` / `Authorization: Bearer <key>` header.

## Project Structure

```
src/
├── server/          # Hono backend (API)
│   ├── routes/      # API routes
│   ├── services/    # Business logic (AI, metadata, screenshots)
│   ├── middleware/   # Auth guards
│   └── utils/       # Helper functions
├── frontend/        # Vue 3 SPA
│   ├── views/       # Pages
│   ├── components/  # Reusable components
│   ├── stores/      # Pinia stores
│   ├── composables/ # Vue composables
│   ├── i18n/        # Translations (en, de)
│   └── router/      # Vue Router
├── db/              # Drizzle ORM (schema, migrations)
├── bot/             # Telegram bot (grammY)
└── shared/          # Shared types & validators
```

## License

[MIT](LICENSE)
