import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq, sql } from "drizzle-orm";

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 Tage
    updateAge: 60 * 60 * 24, // 1 Tag (Session verlängern)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 Minuten Cookie-Cache
    },
    cookiePrefix: "keepomat",
  },
  // __Secure- Cookie-Präfix nur bei HTTPS verwenden.
  // Ohne HTTPS lehnt der Browser diese Cookies ab.
  useSecureCookies: (process.env.BETTER_AUTH_URL || "").startsWith("https://"),
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      isDisabled: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [admin()],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:5173", // Vite Dev Server
  ],
});

// ── Post-Registration: Erster User wird Admin + Settings erstellen ──
export async function handlePostRegistration(request: Request, response: Response) {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/auth/sign-up/email" || !response.ok) {
    return;
  }

  try {
    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .get();

    if (result && result.count === 1) {
      const firstUser = db.select().from(schema.users).limit(1).get();
      if (firstUser) {
        db.update(schema.users)
          .set({ isAdmin: true })
          .where(eq(schema.users.id, firstUser.id))
          .run();
        console.log(`👑 First user ${firstUser.email} set as admin`);

        db.insert(schema.userSettings)
          .values({ userId: firstUser.id })
          .onConflictDoNothing()
          .run();
      }
    } else {
      try {
        const body = await response.clone().json();
        if (body?.user?.id) {
          db.insert(schema.userSettings)
            .values({ userId: body.user.id })
            .onConflictDoNothing()
            .run();
        }
      } catch {}
    }
  } catch (err) {
    console.error("Post-registration hook error:", err);
  }
}

export type Auth = typeof auth;
