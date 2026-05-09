import { getSql } from "@/lib/neon"

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
  // Admin-edited document content (stored in localStorage only)
  msa_content?: string
  welcome_content?: string
  invoice_content?: string
  // Generated PDFs from edited content (stored in localStorage only)
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

// Client operations
export async function getClients(): Promise<Client[]> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      const stored = localStorage.getItem("c-suite-clients")
      return stored ? JSON.parse(stored) : []
    }
    const result = await sqlClient<Client[]>`SELECT * FROM clients ORDER BY created_at DESC`
    return result || []
  } catch (error) {
    console.error("[v0] Error fetching clients:", error)
    const stored = localStorage.getItem("c-suite-clients")
    return stored ? JSON.parse(stored) : []
  }
}

export async function saveClient(client: Client): Promise<void> {
  const now = new Date().toISOString()
  
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    
    await sqlClient`
      INSERT INTO clients (
        id, name, business_name, email, address, plan, price, setup_fee,
        start_date, portal_access, msa_content, invoice_content, welcome_content,
        client_signature, agency_signature, signed_at, agency_signed_at, created_at, updated_at
      ) VALUES (
        ${client.id}, ${client.name}, ${client.business_name}, ${client.email},
        ${client.address || null}, ${client.plan}, ${client.price}, ${client.setup_fee || null},
        ${client.start_date}, ${client.portal_access}, ${client.msa_content || null},
        ${client.invoice_content || null}, ${client.welcome_content || null},
        ${client.client_signature || null}, ${client.agency_signature || null},
        ${client.signed_at || null}, ${client.agency_signed_at || null},
        ${client.created_at || now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = ${client.name}, business_name = ${client.business_name}, email = ${client.email},
        address = ${client.address || null}, plan = ${client.plan}, price = ${client.price},
        setup_fee = ${client.setup_fee || null}, start_date = ${client.start_date},
        portal_access = ${client.portal_access}, msa_content = ${client.msa_content || null},
        invoice_content = ${client.invoice_content || null}, welcome_content = ${client.welcome_content || null},
        client_signature = ${client.client_signature || null}, agency_signature = ${client.agency_signature || null},
        signed_at = ${client.signed_at || null}, agency_signed_at = ${client.agency_signed_at || null},
        updated_at = ${now}
    `

    const clients = await getClients()
    localStorage.setItem("c-suite-clients", JSON.stringify(clients))
  } catch (error) {
    console.error("[v0] Error saving client:", error)
    const stored = localStorage.getItem("c-suite-clients")
    const clients = stored ? JSON.parse(stored) : []
    const index = clients.findIndex((c: Client) => c.id === client.id)
    if (index >= 0) {
      clients[index] = client
    } else {
      clients.push(client)
    }
    localStorage.setItem("c-suite-clients", JSON.stringify(clients))
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    await sqlClient`DELETE FROM clients WHERE id = ${id}`
    const clients = await getClients()
    localStorage.setItem("c-suite-clients", JSON.stringify(clients))
  } catch (error) {
    console.error("[v0] Error deleting client:", error)
    const stored = localStorage.getItem("c-suite-clients")
    const clients = stored ? JSON.parse(stored) : []
    localStorage.setItem("c-suite-clients", JSON.stringify(clients.filter((c: Client) => c.id !== id)))
  }
}

// Client login operations
export async function getClientLogins(): Promise<ClientLogin[]> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      const stored = localStorage.getItem("client_logins")
      return stored ? JSON.parse(stored) : []
    }
    const result = await sqlClient<ClientLogin[]>`SELECT * FROM client_logins`
    return result || []
  } catch (error) {
    console.error("[v0] Error fetching client logins:", error)
    const stored = localStorage.getItem("client_logins")
    return stored ? JSON.parse(stored) : []
  }
}

export async function saveClientLogin(login: ClientLogin): Promise<void> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    await sqlClient`
      INSERT INTO client_logins (id, client_id, password, created_at)
      VALUES (${login.id}, ${login.client_id}, ${login.password}, ${login.created_at || new Date().toISOString()})
      ON CONFLICT (id) DO UPDATE SET client_id = ${login.client_id}, password = ${login.password}
    `
    const logins = await getClientLogins()
    localStorage.setItem("client_logins", JSON.stringify(logins))
  } catch (error) {
    console.error("[v0] Error saving client login:", error)
    const stored = localStorage.getItem("client_logins")
    const logins = stored ? JSON.parse(stored) : []
    const index = logins.findIndex((l: ClientLogin) => l.id === login.id)
    if (index >= 0) {
      logins[index] = login
    } else {
      logins.push(login)
    }
    localStorage.setItem("client_logins", JSON.stringify(logins))
  }
}

// Invitation operations
// Large data (document content + PDF blobs) is stored ONLY in localStorage
// Neon stores only metadata (id, business_name, status, fees, etc.)

export async function getInvitations(): Promise<Invitation[]> {
  // localStorage is the primary source for invitation data (including large content)
  const stored = localStorage.getItem("client_invitations")
  const localInvitations: Invitation[] = stored ? JSON.parse(stored) : []

  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      return localInvitations
    }
    
    const result = await sqlClient<any[]>`
      SELECT id, business_name, contact_name, offer_type, setup_fee, monthly_fee,
             custom_services, special_notes, is_referral, referral_name, status, created_at, updated_at
      FROM invitations
      ORDER BY created_at DESC
    `

    const merged = (result || []).map((inv: any) => {
      const local = localInvitations.find((l) => l.id === inv.id)
      return {
        ...inv,
        // Large fields come from localStorage only
        msa_content: local?.msa_content || undefined,
        welcome_content: local?.welcome_content || undefined,
        invoice_content: local?.invoice_content || undefined,
        msa_pdf_data: local?.msa_pdf_data || undefined,
        welcome_pdf_data: local?.welcome_pdf_data || undefined,
        invoice_pdf_data: local?.invoice_pdf_data || undefined,
      }
    })

    // Include localStorage-only invitations not in Neon yet
    for (const local of localInvitations) {
      if (!merged.find((m) => m.id === local.id)) {
        merged.push(local)
      }
    }

    return merged
  } catch (error) {
    console.error("[v0] Error fetching invitations:", error)
    return localInvitations
  }
}

export async function saveInvitation(invitation: Invitation): Promise<void> {
  // Always save full data to localStorage first
  const stored = localStorage.getItem("client_invitations")
  const localInvitations = stored ? JSON.parse(stored) : []
  const localIndex = localInvitations.findIndex((i: Invitation) => i.id === invitation.id)

  const fullData = {
    ...invitation,
    updated_at: new Date().toISOString(),
  }

  if (localIndex >= 0) {
    localInvitations[localIndex] = fullData
  } else {
    localInvitations.push(fullData)
  }
  localStorage.setItem("client_invitations", JSON.stringify(localInvitations))

  // Save only metadata to Neon (no large content/PDFs)
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    
    const now = new Date().toISOString()
    await sqlClient`
      INSERT INTO invitations (
        id, business_name, contact_name, offer_type, setup_fee, monthly_fee,
        custom_services, special_notes, is_referral, referral_name, status, created_at, updated_at
      ) VALUES (
        ${invitation.id}, ${invitation.business_name}, ${invitation.contact_name || null},
        ${invitation.offer_type}, ${invitation.setup_fee}, ${invitation.monthly_fee},
        ${invitation.custom_services || null}, ${invitation.special_notes || null},
        ${invitation.is_referral || null}, ${invitation.referral_name || null},
        ${invitation.status}, ${invitation.created_at}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        business_name = ${invitation.business_name}, contact_name = ${invitation.contact_name || null},
        offer_type = ${invitation.offer_type}, setup_fee = ${invitation.setup_fee},
        monthly_fee = ${invitation.monthly_fee}, custom_services = ${invitation.custom_services || null},
        special_notes = ${invitation.special_notes || null}, is_referral = ${invitation.is_referral || null},
        referral_name = ${invitation.referral_name || null}, status = ${invitation.status},
        updated_at = ${now}
    `
  } catch (error) {
    console.error("[v0] Neon save failed, data safe in localStorage:", error)
  }
}

export async function deleteInvitation(id: string): Promise<void> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    await sqlClient`DELETE FROM invitations WHERE id = ${id}`
    const invitations = await getInvitations()
    localStorage.setItem("client_invitations", JSON.stringify(invitations.filter((i) => i.id !== id)))
  } catch (error) {
    console.error("[v0] Error deleting invitation:", error)
    const stored = localStorage.getItem("client_invitations")
    const invitations = stored ? JSON.parse(stored) : []
    localStorage.setItem("client_invitations", JSON.stringify(invitations.filter((i: Invitation) => i.id !== id)))
  }
}

// Notification operations
export async function getNotifications(): Promise<Notification[]> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      const stored = localStorage.getItem("c-suite-notifications")
      return stored ? JSON.parse(stored) : []
    }
    
    const result = await sqlClient<any[]>`
      SELECT id, title, message, type, client_id, client_name, read, created_at
      FROM notifications
      ORDER BY created_at DESC
    `

    return (result || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      clientId: n.client_id,
      clientName: n.client_name,
      read: n.read,
      created_at: n.created_at,
    }))
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    const stored = localStorage.getItem("c-suite-notifications")
    return stored ? JSON.parse(stored) : []
  }
}

export async function saveNotification(notification: Notification): Promise<void> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    
    await sqlClient`
      INSERT INTO notifications (id, title, message, type, client_id, client_name, read, created_at)
      VALUES (
        ${notification.id}, ${notification.title}, ${notification.message}, ${notification.type || "info"},
        ${notification.clientId || null}, ${notification.clientName || null}, ${notification.read || false},
        ${notification.created_at || new Date().toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = ${notification.title}, message = ${notification.message}, type = ${notification.type || "info"},
        client_id = ${notification.clientId || null}, client_name = ${notification.clientName || null},
        read = ${notification.read || false}
    `

    const notifications = await getNotifications()
    localStorage.setItem("c-suite-notifications", JSON.stringify(notifications))
  } catch (error) {
    console.error("[v0] Error saving notification:", error)
    const stored = localStorage.getItem("c-suite-notifications")
    const notifications = stored ? JSON.parse(stored) : []
    const index = notifications.findIndex((n: Notification) => n.id === notification.id)
    if (index >= 0) {
      notifications[index] = notification
    } else {
      notifications.push(notification)
    }
    localStorage.setItem("c-suite-notifications", JSON.stringify(notifications))
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    await sqlClient`UPDATE notifications SET read = true WHERE id = ${id}`
    const notifications = await getNotifications()
    localStorage.setItem("c-suite-notifications", JSON.stringify(notifications))
  } catch (error) {
    console.error("[v0] Error marking notification read:", error)
    const stored = localStorage.getItem("c-suite-notifications")
    const notifications = stored ? JSON.parse(stored) : []
    const updated = notifications.map((n: Notification) => (n.id === id ? { ...n, read: true } : n))
    localStorage.setItem("c-suite-notifications", JSON.stringify(updated))
  }
}

export async function deleteNotification(id: string): Promise<void> {
  try {
    const sqlClient = await getSql()
    if (!sqlClient) {
      throw new Error("Database not available")
    }
    await sqlClient`DELETE FROM notifications WHERE id = ${id}`
    const notifications = await getNotifications()
    localStorage.setItem("c-suite-notifications", JSON.stringify(notifications))
  } catch (error) {
    console.error("[v0] Error deleting notification:", error)
    const stored = localStorage.getItem("c-suite-notifications")
    const notifications = stored ? JSON.parse(stored) : []
    localStorage.setItem(
      "c-suite-notifications",
      JSON.stringify(notifications.filter((n: Notification) => n.id !== id)),
    )
  }
}
