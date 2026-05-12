import { MASTER_PASSWORD } from "@/lib/auth"

export interface Client {
  id: string
  name: string
  business_name: string
  email: string
  phone?: string
  address?: string
  plan: string
  price: number
  setup_fee?: number
  start_date: string
  portal_access: string
  msa_content?: string
  invoice_content?: string
  welcome_content?: string
  client_signature?: string
  agency_signature?: string
  signed_at?: string
  agency_signed_at?: string
  created_at?: string
  updated_at?: string
}

export interface ClientLogin {
  id: string
  client_id: string
  password: string
  created_at?: string
}

export interface Invitation {
  id: string
  business_name: string
  contact_name?: string
  client_email?: string
  offer_type: string
  setup_fee: number
  monthly_fee: number
  custom_services?: string
  special_notes?: string
  is_referral?: string
  referral_name?: string
  status: string
  created_at: string
  updated_at?: string
  sent_at?: string
  // Admin-edited document content (stored in localStorage only — too large for a row write).
  msa_content?: string
  welcome_content?: string
  invoice_content?: string
  // Generated PDFs from edited content (stored in localStorage only).
  msa_pdf_data?: string
  welcome_pdf_data?: string
  invoice_pdf_data?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type?: string
  clientId?: string
  clientName?: string
  read?: boolean
  created_at?: string
}

const LS = {
  clients: "c-suite-clients",
  invitations: "client_invitations",
  logins: "client_logins",
  notifications: "c-suite-notifications",
}

const adminHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  "X-Orage-Auth": MASTER_PASSWORD,
})

const publicHeaders: HeadersInit = { "Content-Type": "application/json" }

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeLocal<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error("[storage] localStorage write failed for", key, err)
  }
}

/* ──────────────────────────────  CLIENTS  ────────────────────────────── */

export async function getClients(): Promise<Client[]> {
  try {
    const r = await fetch("/api/portal/clients", { headers: adminHeaders(), cache: "no-store" })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { clients } = (await r.json()) as { clients: Client[] }
    writeLocal(LS.clients, clients)
    return clients
  } catch (err) {
    console.warn("[storage] getClients fell back to localStorage:", err)
    return readLocal<Client>(LS.clients)
  }
}

export async function saveClient(
  client: Client,
  opts?: { invitationId?: string },
): Promise<void> {
  // Cache locally first so the UI is responsive on slow networks.
  const local = readLocal<Client>(LS.clients)
  const idx = local.findIndex((c) => c.id === client.id)
  if (idx >= 0) local[idx] = client
  else local.push(client)
  writeLocal(LS.clients, local)

  const headers: HeadersInit = opts?.invitationId ? publicHeaders : adminHeaders()
  const payload = opts?.invitationId ? { ...client, invitation_id: opts.invitationId } : client
  const r = await fetch("/api/portal/clients", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    const text = await r.text()
    console.error("[storage] saveClient API failed:", r.status, text)
    throw new Error(`Failed to save client: ${r.status}`)
  }
}

export async function deleteClient(id: string): Promise<void> {
  const local = readLocal<Client>(LS.clients).filter((c) => c.id !== id)
  writeLocal(LS.clients, local)
  const r = await fetch(`/api/portal/clients?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  })
  if (!r.ok) console.warn("[storage] deleteClient API failed (local removed):", r.status)
}

/* ────────────────────────  CLIENT LOGINS  ──────────────────────────── */

export async function getClientLogins(): Promise<ClientLogin[]> {
  try {
    const r = await fetch("/api/portal/client-logins", { headers: adminHeaders(), cache: "no-store" })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { logins } = (await r.json()) as { logins: ClientLogin[] }
    writeLocal(LS.logins, logins)
    return logins
  } catch (err) {
    console.warn("[storage] getClientLogins fell back to localStorage:", err)
    return readLocal<ClientLogin>(LS.logins)
  }
}

export async function saveClientLogin(login: ClientLogin): Promise<void> {
  const local = readLocal<ClientLogin>(LS.logins)
  const idx = local.findIndex((l) => l.id === login.id)
  if (idx >= 0) local[idx] = login
  else local.push(login)
  writeLocal(LS.logins, local)
  const r = await fetch("/api/portal/client-logins", {
    method: "POST",
    headers: publicHeaders, // public — paired with client creation during onboard
    body: JSON.stringify(login),
  })
  if (!r.ok) console.warn("[storage] saveClientLogin API failed (local saved):", r.status)
}

/* ────────────────────────  INVITATIONS  ──────────────────────────── */

export async function getInvitations(): Promise<Invitation[]> {
  // Large fields (msa_content / pdf_data) live in localStorage only — merge in.
  const local = readLocal<Invitation>(LS.invitations)
  try {
    const r = await fetch("/api/portal/invitations", { headers: adminHeaders(), cache: "no-store" })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { invitations } = (await r.json()) as { invitations: Invitation[] }
    const merged: Invitation[] = invitations.map((inv) => {
      const l = local.find((x) => x.id === inv.id)
      return {
        ...inv,
        msa_content: l?.msa_content,
        welcome_content: l?.welcome_content,
        invoice_content: l?.invoice_content,
        msa_pdf_data: l?.msa_pdf_data,
        welcome_pdf_data: l?.welcome_pdf_data,
        invoice_pdf_data: l?.invoice_pdf_data,
      }
    })
    // Include invitations created locally that the server hasn't seen yet.
    for (const l of local) if (!merged.find((m) => m.id === l.id)) merged.push(l)
    return merged
  } catch (err) {
    console.warn("[storage] getInvitations fell back to localStorage:", err)
    return local
  }
}

/**
 * Public fetch by ID — used by the client onboard page. Does NOT require
 * admin auth (the link itself is the secret).
 */
export async function getInvitationById(id: string): Promise<Invitation | null> {
  const local = readLocal<Invitation>(LS.invitations).find((i) => i.id === id) || null
  try {
    const r = await fetch(`/api/portal/invitations/${encodeURIComponent(id)}`, {
      cache: "no-store",
    })
    if (r.status === 404) return null
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { invitation } = (await r.json()) as { invitation: Invitation }
    // Merge in localStorage's content fields if this is the inviter's browser.
    return {
      ...invitation,
      msa_content: local?.msa_content,
      welcome_content: local?.welcome_content,
      invoice_content: local?.invoice_content,
      msa_pdf_data: local?.msa_pdf_data,
      welcome_pdf_data: local?.welcome_pdf_data,
      invoice_pdf_data: local?.invoice_pdf_data,
    }
  } catch (err) {
    console.warn("[storage] getInvitationById fell back to localStorage:", err)
    return local
  }
}

export async function saveInvitation(invitation: Invitation): Promise<void> {
  // Persist full record (incl. large content) to localStorage immediately.
  const local = readLocal<Invitation>(LS.invitations)
  const idx = local.findIndex((i) => i.id === invitation.id)
  const full = { ...invitation, updated_at: new Date().toISOString() }
  if (idx >= 0) local[idx] = full
  else local.push(full)
  writeLocal(LS.invitations, local)

  // Send only metadata to the server. Strip large content + PDFs to keep
  // the row small and the request fast.
  const {
    msa_content: _msa,
    welcome_content: _welcome,
    invoice_content: _invoice,
    msa_pdf_data: _msaPdf,
    welcome_pdf_data: _welcomePdf,
    invoice_pdf_data: _invoicePdf,
    ...metadata
  } = invitation
  void [_msa, _welcome, _invoice, _msaPdf, _welcomePdf, _invoicePdf]
  const r = await fetch("/api/portal/invitations", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(metadata),
  })
  if (!r.ok) {
    const text = await r.text()
    console.error("[storage] saveInvitation API failed:", r.status, text)
    throw new Error(`Failed to save invitation: ${r.status}`)
  }
}

/**
 * Public — flips invitation status to "completed" from the client onboard page.
 * Hits the dedicated public route (no admin token required, link is the secret).
 */
export async function completeInvitationPublic(id: string): Promise<void> {
  const local = readLocal<Invitation>(LS.invitations)
  const idx = local.findIndex((i) => i.id === id)
  if (idx >= 0) {
    local[idx] = { ...local[idx], status: "completed", updated_at: new Date().toISOString() }
    writeLocal(LS.invitations, local)
  }
  const r = await fetch(`/api/portal/invitations/${encodeURIComponent(id)}/complete`, {
    method: "POST",
    headers: publicHeaders,
  })
  if (!r.ok) console.warn("[storage] completeInvitationPublic API failed:", r.status)
}

/**
 * Admin — dispatches the signing-link email through Gmail SMTP and stamps
 * `sent_at` + `client_email` on the row.
 */
export async function sendInvitationEmail(
  id: string,
  opts?: { email?: string; contact_name?: string },
): Promise<{ sent_to: string; sent_at: string }> {
  const r = await fetch(`/api/portal/invitations/${encodeURIComponent(id)}/send`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(opts ?? {}),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error((data as { error?: string }).error || `Send failed (${r.status})`)
  }
  // Reflect the send in localStorage so the UI shows "Sent" without a refetch.
  const local = readLocal<Invitation>(LS.invitations)
  const idx = local.findIndex((i) => i.id === id)
  if (idx >= 0) {
    local[idx] = {
      ...local[idx],
      client_email: (data as { sent_to?: string }).sent_to || local[idx].client_email,
      sent_at: (data as { sent_at?: string }).sent_at,
      updated_at: new Date().toISOString(),
    }
    writeLocal(LS.invitations, local)
  }
  return data as { sent_to: string; sent_at: string }
}

/**
 * Admin — clears the client's signature, the agency's signature, or both.
 */
export async function clearClientSignature(
  clientId: string,
  which: "client" | "agency" | "both",
): Promise<void> {
  const r = await fetch(
    `/api/portal/clients/${encodeURIComponent(clientId)}/clear-signature`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ which }),
    },
  )
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`Failed to clear signature: ${r.status} ${text}`)
  }
  // Reflect locally so the documents page doesn't have to refetch.
  const local = readLocal<Client>(LS.clients)
  const idx = local.findIndex((c) => c.id === clientId)
  if (idx >= 0) {
    const c = { ...local[idx] }
    if (which === "client" || which === "both") {
      c.client_signature = undefined
      c.signed_at = undefined
    }
    if (which === "agency" || which === "both") {
      c.agency_signature = undefined
      c.agency_signed_at = undefined
    }
    c.updated_at = new Date().toISOString()
    local[idx] = c
    writeLocal(LS.clients, local)
  }
}

/* ────────────────────────  SIGN TOKENS  ──────────────────────────── */

/**
 * Admin — mint a unique one-time signing link for an existing client.
 * Returns the bearer token plus the full URL to share.
 */
export async function createSignToken(
  clientId: string,
  opts?: { doc_key?: "msa" | "welcome" | "invoice"; expires_in_days?: number },
): Promise<{ token: string; url: string; expires_at: string | null }> {
  const r = await fetch(
    `/api/portal/clients/${encodeURIComponent(clientId)}/sign-tokens`,
    {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(opts ?? {}),
    },
  )
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error((data as { error?: string }).error || `Could not create sign link (${r.status})`)
  }
  return data as { token: string; url: string; expires_at: string | null }
}

export interface PublicTokenDocument {
  token: string
  client_id: string
  doc_key: string
  signed_at: string | null
  expires_at: string | null
  business_name: string
  name: string
  email: string
  msa_content: string | null
  invoice_content: string | null
  welcome_content: string | null
  agency_signature: string | null
  agency_signed_at: string | null
}

/**
 * Public — load the document a one-time token points to. Returns
 * { locked: true } if the token has already been used, { expired: true }
 * if it has expired, or null if it doesn't exist.
 */
export async function getDocumentByToken(
  token: string,
): Promise<
  | { document: PublicTokenDocument; locked?: false; expired?: false }
  | { locked: true }
  | { expired: true }
  | null
> {
  const r = await fetch(
    `/api/portal/sign-tokens/${encodeURIComponent(token)}`,
    { cache: "no-store" },
  )
  if (r.status === 404) return null
  const data = await r.json().catch(() => ({}))
  if (r.status === 410) {
    if ((data as { locked?: boolean }).locked) return { locked: true }
    if ((data as { expired?: boolean }).expired) return { expired: true }
    return { locked: true }
  }
  if (!r.ok) throw new Error((data as { error?: string }).error || `Failed (${r.status})`)
  return { document: (data as { document: PublicTokenDocument }).document }
}

/**
 * Public — submit a signature against a one-time token. Server atomically
 * locks the token + writes the signature to the client row.
 */
export async function submitSignatureForToken(
  token: string,
  signature: string,
): Promise<{ signed_at: string; client_id: string }> {
  const r = await fetch(
    `/api/portal/sign-tokens/${encodeURIComponent(token)}/sign`,
    {
      method: "POST",
      headers: publicHeaders,
      body: JSON.stringify({ signature }),
    },
  )
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error((data as { error?: string }).error || `Signature submit failed (${r.status})`)
  }
  return data as { signed_at: string; client_id: string }
}

/* ────────────────────────  PUBLIC SIGN  ──────────────────────────── */

/**
 * Public — fetches a client by ID for the /sign/[id] public sign page.
 * Returns just the fields needed to render the document + show existing
 * signature state. No admin auth required (the client ID is the secret).
 */
export interface PublicClientForSign {
  id: string
  name: string
  business_name: string
  email: string
  msa_content?: string | null
  invoice_content?: string | null
  welcome_content?: string | null
  client_signature?: string | null
  agency_signature?: string | null
  signed_at?: string | null
  agency_signed_at?: string | null
}

export async function getClientForSigning(
  clientId: string,
): Promise<PublicClientForSign | null> {
  const r = await fetch(
    `/api/portal/clients/${encodeURIComponent(clientId)}/sign-public`,
    { cache: "no-store" },
  )
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Failed to load client: ${r.status}`)
  const data = (await r.json()) as { client: PublicClientForSign }
  return data.client
}

/**
 * Public — submits a client signature. Returns the signed_at timestamp.
 */
export async function submitClientSignature(
  clientId: string,
  signature: string,
): Promise<{ signed_at: string }> {
  const r = await fetch(
    `/api/portal/clients/${encodeURIComponent(clientId)}/sign-public`,
    {
      method: "POST",
      headers: publicHeaders,
      body: JSON.stringify({ signature }),
    },
  )
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error((data as { error?: string }).error || `Signature submit failed (${r.status})`)
  }
  return data as { signed_at: string }
}

export async function deleteInvitation(id: string): Promise<void> {
  const local = readLocal<Invitation>(LS.invitations).filter((i) => i.id !== id)
  writeLocal(LS.invitations, local)
  const r = await fetch(`/api/portal/invitations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  })
  if (!r.ok) console.warn("[storage] deleteInvitation API failed (local removed):", r.status)
}

/* ────────────────────────  NOTIFICATIONS  ──────────────────────────── */

export async function getNotifications(): Promise<Notification[]> {
  try {
    const r = await fetch("/api/portal/notifications", { headers: adminHeaders(), cache: "no-store" })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { notifications } = (await r.json()) as { notifications: Array<Notification & { client_id?: string; client_name?: string }> }
    const mapped = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type ?? undefined,
      clientId: n.client_id ?? undefined,
      clientName: n.client_name ?? undefined,
      read: n.read ?? false,
      created_at: n.created_at ?? undefined,
    }))
    writeLocal(LS.notifications, mapped)
    return mapped
  } catch (err) {
    console.warn("[storage] getNotifications fell back to localStorage:", err)
    return readLocal<Notification>(LS.notifications)
  }
}

export async function saveNotification(n: Notification): Promise<void> {
  const local = readLocal<Notification>(LS.notifications)
  const idx = local.findIndex((x) => x.id === n.id)
  if (idx >= 0) local[idx] = n
  else local.push(n)
  writeLocal(LS.notifications, local)
  const r = await fetch("/api/portal/notifications", {
    method: "POST",
    headers: publicHeaders, // public — fired by client-side completion paths
    body: JSON.stringify({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      client_id: n.clientId,
      client_name: n.clientName,
      read: n.read,
      created_at: n.created_at,
    }),
  })
  if (!r.ok) console.warn("[storage] saveNotification API failed (local saved):", r.status)
}

export async function markNotificationRead(id: string): Promise<void> {
  const local = readLocal<Notification>(LS.notifications).map((n) =>
    n.id === id ? { ...n, read: true } : n,
  )
  writeLocal(LS.notifications, local)
  const r = await fetch(`/api/portal/notifications?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: adminHeaders(),
  })
  if (!r.ok) console.warn("[storage] markNotificationRead API failed:", r.status)
}

export async function deleteNotification(id: string): Promise<void> {
  const local = readLocal<Notification>(LS.notifications).filter((n) => n.id !== id)
  writeLocal(LS.notifications, local)
  const r = await fetch(`/api/portal/notifications?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  })
  if (!r.ok) console.warn("[storage] deleteNotification API failed:", r.status)
}
