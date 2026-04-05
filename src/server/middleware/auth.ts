import type { Context, Next } from "hono";
import { auth } from "../auth";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";

// Session-basierte Authentifizierung
export async function authGuard(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    // Prüfe auf API-Key
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const keyHash = await hashApiKey(token);

      const apiKey = db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.keyHash, keyHash))
        .get();

      if (apiKey) {
        // API-Key last used aktualisieren
        db.update(schema.apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(schema.apiKeys.id, apiKey.id))
          .run();

        // User laden
        const user = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, apiKey.userId))
          .get();

        if (user && !user.isDisabled) {
          c.set("user" as never, user);
          c.set("session" as never, null);
          c.set("authMethod" as never, "api-key");
          return next();
        }
      }
    }

    return c.json({ error: "Nicht autorisiert" }, 401);
  }

  // Prüfe ob User gesperrt ist
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .get();

  if (user?.isDisabled) {
    return c.json({ error: "Account gesperrt" }, 403);
  }

  c.set("user" as never, session.user);
  c.set("session" as never, session.session);
  c.set("authMethod" as never, "session");
  return next();
}

// Admin-Check
export async function adminGuard(c: Context, next: Next) {
  const user = c.get("user" as never) as any;
  if (!user?.isAdmin) {
    return c.json({ error: "Nur für Administratoren" }, 403);
  }
  return next();
}

// API-Key hashen
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
