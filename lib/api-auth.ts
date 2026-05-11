import { NextResponse } from "next/server"
import { MASTER_PASSWORD } from "./auth"

/**
 * Tiny shared-secret check for admin API routes. The portal's auth is a
 * client-side localStorage flag — we don't have a cookie-based session — so
 * the simplest server-enforced check is "the caller must know the master
 * password." Matches the security posture of the existing master-password UX.
 *
 * Routes that are intentionally public (e.g., fetch invitation by link,
 * client-side onboard completion) do NOT use this guard.
 */
export function requireAdmin(req: Request): NextResponse | null {
  const provided = req.headers.get("x-orage-auth")
  if (provided !== MASTER_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
