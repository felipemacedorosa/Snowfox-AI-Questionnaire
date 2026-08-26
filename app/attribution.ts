/**
 * Post/campaign attribution for the assessment funnel.
 *
 * The marketing links use standard UTM parameters, for example:
 *   ?utm_source=linkedin&utm_medium=social&utm_campaign=readiness
 *    &utm_content=post-assess-033&utm_term=governanca
 *
 * `utm_content` identifies the individual post, so it is the field that
 * answers "which post produced this visitor".
 *
 * Google Analytics already reads these parameters natively and applies them to
 * every event in the session, so this module deliberately does not reimplement
 * campaign attribution. It exists for the one case GA4's session-scoped
 * dimensions cannot cover: a respondent who arrives from a post, leaves partway
 * through, and returns later from a bookmark or a plain URL. That later visit
 * is a new session with no campaign, so the conversion would be credited to
 * direct traffic and the post would lose it. Remembering the first-seen values
 * keeps the whole funnel attributable to the post that actually earned it.
 *
 * UTM values are marketing identifiers chosen by whoever builds the link. No
 * respondent-provided value is ever read here.
 */

export const ATTRIBUTION_STORAGE_KEY = "snowfox-ai-attribution-v1";

/** Google Analytics truncates event parameter values at 100 characters. */
export const MAX_VALUE_LENGTH = 100;

export interface Attribution {
  /** `utm_content`: the individual post or link variant. */
  postId: string;
  /** `utm_source`: the channel, such as `linkedin`. */
  source: string;
  /** `utm_medium`: such as `social`. */
  medium: string;
  /** `utm_campaign`: the campaign the post belongs to. */
  campaign: string;
  /** `utm_term`: the keyword or theme. */
  term: string;
}

export const EMPTY_ATTRIBUTION: Attribution = Object.freeze({
  postId: "",
  source: "",
  medium: "",
  campaign: "",
  term: "",
});

/**
 * Trim, drop control characters, and clamp to what Analytics will accept.
 *
 * Filtering by code point rather than a character class keeps the control
 * characters themselves out of this source file.
 */
function sanitize(value: string | null): string {
  if (typeof value !== "string") return "";
  let cleaned = "";
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) cleaned += character;
  }
  return cleaned.trim().slice(0, MAX_VALUE_LENGTH);
}

/** Read the UTM parameters out of a query string such as `window.location.search`. */
export function parseAttribution(search: string): Attribution {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return { ...EMPTY_ATTRIBUTION };
  }
  return {
    postId: sanitize(params.get("utm_content")),
    source: sanitize(params.get("utm_source")),
    medium: sanitize(params.get("utm_medium")),
    campaign: sanitize(params.get("utm_campaign")),
    term: sanitize(params.get("utm_term")),
  };
}

export function hasAttribution(attribution: Attribution): boolean {
  return Object.values(attribution).some(value => value !== "");
}

/**
 * Decide which attribution applies to this visit.
 *
 * A link carrying UTM parameters always wins, matching how Analytics treats a
 * fresh campaign click as the new attribution. A visit with no parameters falls
 * back to whatever the previous campaign visit stored.
 */
export function resolveAttribution(fromUrl: Attribution, stored: Attribution | null): Attribution {
  if (hasAttribution(fromUrl)) return fromUrl;
  if (stored && hasAttribution(stored)) return stored;
  return { ...EMPTY_ATTRIBUTION };
}

/**
 * Analytics event parameters for an attribution.
 *
 * Empty fields are omitted rather than sent blank, so an unattributed visit
 * stays visibly unattributed instead of creating empty dimension values. The
 * `post_` prefix keeps these clear of the campaign fields Analytics populates
 * natively, so the two never overwrite each other.
 */
export function toEventParams(attribution: Attribution): Record<string, string> {
  const params: Record<string, string> = {};
  if (attribution.postId) params.post_id = attribution.postId;
  if (attribution.source) params.post_source = attribution.source;
  if (attribution.medium) params.post_medium = attribution.medium;
  if (attribution.campaign) params.post_campaign = attribution.campaign;
  if (attribution.term) params.post_term = attribution.term;
  return params;
}

/** Recover a stored attribution, ignoring anything malformed. */
export function parseStoredAttribution(value: unknown): Attribution | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const read = (key: keyof Attribution) => sanitize(typeof record[key] === "string" ? record[key] as string : "");
  const attribution: Attribution = {
    postId: read("postId"),
    source: read("source"),
    medium: read("medium"),
    campaign: read("campaign"),
    term: read("term"),
  };
  return hasAttribution(attribution) ? attribution : null;
}

export function readStoredAttribution(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? parseStoredAttribution(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function persistAttribution(attribution: Attribution): void {
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution still applies to this load; only cross-session recall is lost.
  }
}
