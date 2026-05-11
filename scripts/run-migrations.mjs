#!/usr/bin/env node
/**
 * One-shot migration runner. Applies every *.sql in this directory in
 * lexicographic order against the Neon database.
 *
 * Idempotent — each script uses CREATE TABLE IF NOT EXISTS / ADD COLUMN
 * IF NOT EXISTS, so re-running is safe.
 *
 * Usage (from repo root, with .env.local present):
 *   node scripts/run-migrations.mjs
 */
import { neon } from "@neondatabase/serverless"
import { readFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { config } from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, "..", ".env.local") })

const url =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.NEON_POSTGRES_URL ||
  process.env.POSTGRES_URL

if (!url) {
  console.error("No Postgres connection string found in .env.local")
  process.exit(1)
}

const sql = neon(url)
const files = readdirSync(__dirname)
  .filter((f) => f.endsWith(".sql"))
  .sort()

console.log(`Applying ${files.length} migration(s) to ${new URL(url).hostname}...`)
for (const f of files) {
  const body = readFileSync(join(__dirname, f), "utf8")
  // Split into statements and run sequentially — neon-serverless doesn't
  // support multi-statement strings in one tag call.
  const statements = body
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--") || (s.includes("\n") && /\S/.test(s.replace(/--.*$/gm, ""))))
  let applied = 0
  for (const s of statements) {
    // Strip standalone comment lines but keep mixed content.
    const cleaned = s
      .split(/\r?\n/)
      .filter((line) => !/^\s*--/.test(line))
      .join("\n")
      .trim()
    if (!cleaned) continue
    try {
      await sql.query(cleaned)
      applied++
    } catch (err) {
      // Treat "already exists" as a no-op — these scripts are designed to be
      // idempotent but PostgreSQL has no IF NOT EXISTS for policies.
      const msg = String(err.message || "")
      if (/already exists/i.test(msg)) {
        applied++
        continue
      }
      console.error(`  ✗ ${f} :: ${msg}\n    ${cleaned.slice(0, 120)}...`)
      process.exit(1)
    }
  }
  console.log(`  ✓ ${f} (${applied} statements)`)
}
console.log("All migrations applied.")
