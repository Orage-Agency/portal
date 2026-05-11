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
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set on this deployment. Add it under Vercel → Project → Settings → Environment Variables.",
    )
  }
  cached = neon(url)
  return cached
}
