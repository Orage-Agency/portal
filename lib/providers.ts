/**
 * Registry of third-party tools Orage clients can connect from the portal.
 * The kind decides UI + storage:
 *   - "oauth": full OAuth flow via Nango (preferred — zero friction for client)
 *   - "app_password": client pastes their own credentials once (used for
 *     WordPress self-hosted which doesn't OAuth in the standard way)
 *
 * `nangoIntegrationId` must match the integration unique key configured in
 * the Nango dashboard exactly. By convention we use the provider slug.
 */

export interface ProviderDef {
  id: string                    // canonical id used in URLs + DB
  label: string                 // user-facing name
  category: "calendar" | "email" | "scheduling" | "crm" | "payments" | "site"
  kind: "oauth" | "app_password"
  nangoIntegrationId?: string   // for kind="oauth", matches Nango config
  use: string                   // one-line "what Orage uses this for"
  icon: string                  // emoji or url for now — keep simple
  scopes?: string[]             // hint scopes (Nango integration owns the real list)
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "google-calendar",
    label: "Google Calendar",
    category: "calendar",
    kind: "oauth",
    nangoIntegrationId: "google-calendar",
    use: "STACY books appointments straight into your calendar.",
    icon: "📅",
    scopes: ["https://www.googleapis.com/auth/calendar"],
  },
  {
    id: "gmail",
    label: "Gmail",
    category: "email",
    kind: "oauth",
    nangoIntegrationId: "gmail",
    use: "Send confirmations, follow-ups, and weekly summaries from your address.",
    icon: "✉️",
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
  },
  {
    id: "calendly",
    label: "Calendly",
    category: "scheduling",
    kind: "oauth",
    nangoIntegrationId: "calendly",
    use: "Sync booked slots; STACY checks availability before offering times.",
    icon: "🗓",
  },
  {
    id: "gohighlevel",
    label: "GoHighLevel",
    category: "crm",
    kind: "oauth",
    nangoIntegrationId: "gohighlevel",
    use: "STACY logs every call + lead straight into your CRM.",
    icon: "📞",
  },
  {
    id: "stripe",
    label: "Stripe",
    category: "payments",
    kind: "oauth",
    nangoIntegrationId: "stripe",
    use: "Read customer history; surface high-value callers to your agent.",
    icon: "💳",
  },
  {
    id: "square",
    label: "Square",
    category: "payments",
    kind: "oauth",
    nangoIntegrationId: "square",
    use: "Sync customer + transaction data so the agent has full context.",
    icon: "⬛",
  },
  {
    id: "wordpress",
    label: "WordPress",
    category: "site",
    kind: "app_password",
    use: "Update site content + embed the chat widget without you logging in.",
    icon: "🌐",
  },
]

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id)
}
