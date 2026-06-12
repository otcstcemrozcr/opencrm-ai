import "server-only";

export type ApolloPerson = {
  title: string | null;
  linkedin: string | null;
  phone: string | null;
  email: string | null;
  organizationName: string | null;
  industry: string | null;
};

export type EnrichResult =
  | { configured: false }
  | { configured: true; found: false }
  | { configured: true; found: true; person: ApolloPerson };

export type EnrichInput = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  organizationName?: string | null;
  domain?: string | null;
};

export function isApolloConfigured(): boolean {
  return Boolean(process.env.APOLLO_API_KEY);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parsePerson(p: any): ApolloPerson {
  const phone =
    p?.phone_numbers?.[0]?.raw_number ??
    p?.organization?.phone ??
    p?.sanitized_phone ??
    null;
  return {
    title: p?.title ?? null,
    linkedin: p?.linkedin_url ?? null,
    phone,
    email: p?.email ?? null,
    organizationName: p?.organization?.name ?? null,
    industry: p?.organization?.industry ?? null,
  };
}

/**
 * Enrich a person via Apollo's People Match API. Degrades gracefully: returns
 * configured:false when no APOLLO_API_KEY is set, and never throws on failure.
 */
export async function enrichPerson(input: EnrichInput): Promise<EnrichResult> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) return { configured: false };

  try {
    const res = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": key,
      },
      body: JSON.stringify({
        email: input.email || undefined,
        first_name: input.firstName || undefined,
        last_name: input.lastName || undefined,
        name: input.name || undefined,
        organization_name: input.organizationName || undefined,
        domain: input.domain || undefined,
        reveal_personal_emails: false,
      }),
    });
    if (!res.ok) return { configured: true, found: false };
    const data = (await res.json()) as { person?: unknown };
    if (!data.person) return { configured: true, found: false };
    return { configured: true, found: true, person: parsePerson(data.person) };
  } catch {
    return { configured: true, found: false };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
