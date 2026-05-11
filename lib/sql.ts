import { neon } from "@neondatabase/serverless"

/**
 * Server-only Neon SQL client. Imported by route handlers under /app/api/portal/*
 * so DATABASE_URL is read from the Node runtime (not the client bundle).
 *
 * NEVER import this from a client component — Next.js would error on the
 * neon import or expose the connection string.
 */
let cached: ReturnType<typeof neon> | null = null

export function sql() {
  if (cached) return cached
  // Accept either the canonical DATABASE_URL or the auto-injected Neon-
  // integration env names. The Vercel-Neon Marketplace integration prefixes
  // its variables with NEON_, so naïve `DATABASE_URL` checks always miss.
  const url =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL ||
    process.env.POSTGRES_URL
  if (!url) {
    throw new Error(
      "No Postgres connection string found. Set DATABASE_URL, NEON_DATABASE_URL, NEON_POSTGRES_URL, or POSTGRES_URL under Vercel → Project → Settings → Environment Variables.",
    )
  }
  cached = neon(url)
  return cached
}
