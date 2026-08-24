import { createClient } from "@supabase/supabase-js";

export type NormalizedStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance"
  | "unknown";

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  category: string;
  status_page_url: string;
  current_status: NormalizedStatus;
  current_status_description: string | null;
  last_checked_at: string | null;
  last_changed_at: string | null;
}

interface StatusMeta {
  label: string;
  /** Lower = worse. Used to sort problem vendors to the top of the list. */
  severity: number;
  dotClass: string;
  badgeClass: string;
}

export const STATUS_META: Record<NormalizedStatus, StatusMeta> = {
  major_outage: {
    label: "Major outage",
    severity: 0,
    dotClass: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
  partial_outage: {
    label: "Partial outage",
    severity: 1,
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  },
  degraded: {
    label: "Degraded performance",
    severity: 2,
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  maintenance: {
    label: "Maintenance",
    severity: 3,
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  // Covers both "never successfully polled yet" and vendors seeded as
  // 'unverified' (no working status API found — see the poller's seed.sql).
  // Deliberately not styled as a problem: it's a data gap, not a confirmed
  // incident, so it's excluded from the "systems experiencing issues" count.
  unknown: {
    label: "Status unavailable",
    severity: 4,
    dotClass: "bg-zinc-400",
    badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400",
  },
  operational: {
    label: "Operational",
    severity: 5,
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Check .env.local.",
    );
  }
  // A fresh client per request is intentional: this is a public, read-only
  // page with no session or auth state to persist across requests, so a
  // shared singleton client would buy nothing here.
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Fetches every vendor, sorted worst-status-first so problems are immediately visible. */
export async function getVendors(): Promise<Vendor[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vendors")
    .select(
      "id, slug, name, category, status_page_url, current_status, current_status_description, last_checked_at, last_changed_at",
    );

  if (error) {
    throw new Error(`Failed to load vendors from Supabase: ${error.message}`);
  }

  const vendors = (data ?? []) as Vendor[];
  return vendors.sort((a, b) => {
    const severityDiff = STATUS_META[a.current_status].severity - STATUS_META[b.current_status].severity;
    return severityDiff !== 0 ? severityDiff : a.name.localeCompare(b.name);
  });
}

/** Renders an ISO timestamp as "3 minutes ago" using a built-in Intl API — no date library needed. */
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "never";

  const diffSec = Math.round((Date.parse(iso) - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}
