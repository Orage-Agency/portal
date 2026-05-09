let sql: any = null
let initialized = false

/**
 * Get the Neon SQL client with lazy initialization using dynamic import.
 * Returns null if DATABASE_URL is not available (during build/preview).
 * Only loads and connects the Neon client when actually needed at runtime.
 */
export async function getSql() {
  if (initialized) {
    return sql
  }

  initialized = true

  if (!process.env.DATABASE_URL) {
    return null
  }

  try {
    // Dynamically import Neon only at runtime, not at build time
    const { neon } = await import("@neondatabase/serverless")
    sql = neon(process.env.DATABASE_URL!)
    return sql
  } catch (error) {
    console.error("[v0] Failed to initialize Neon client:", error)
    return null
  }
}
