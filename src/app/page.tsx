"use client";

import { useEffect, useState } from "react";
import { getVendors, STATUS_META, formatRelativeTime, type Vendor } from "@/lib/vendors";

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVendors()
      .then((v) => {
        if (!cancelled) setVendors(v);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm text-red-600 dark:text-red-400">Failed to load status: {error}</p>
      </main>
    );
  }

  if (!vendors) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </main>
    );
  }

  const monitoredSeverities = vendors
    .filter((v) => v.current_status !== "unknown")
    .map((v) => STATUS_META[v.current_status].severity);
  const worstSeverity = monitoredSeverities.length > 0 ? Math.min(...monitoredSeverities) : STATUS_META.operational.severity;
  const allOperational = worstSeverity >= STATUS_META.operational.severity;
  const affectedCount = vendors.filter(
    (v) => v.current_status !== "unknown" && v.current_status !== "operational",
  ).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">OutageRadar</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Live status for the tools your team depends on — checked automatically every 5 minutes.
        </p>
      </header>
      <div
        className={`mb-8 rounded-lg border px-4 py-3 text-sm font-medium ${
          allOperational
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
        }`}
      >
        {allOperational
          ? "All monitored systems operational"
          : `${affectedCount} service${affectedCount === 1 ? "" : "s"} experiencing issues`}
      </div>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {vendors.map((vendor) => {
          const meta = STATUS_META[vendor.current_status];
          return (
            <li key={vendor.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`} aria-hidden="true" />
                  <span className="font-medium">{vendor.name}</span>
                </div>
                {vendor.current_status_description && (
                  <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {vendor.current_status_description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
                  {meta.label}
                </span>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  checked {formatRelativeTime(vendor.last_checked_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <footer className="mt-10 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Data refreshes automatically — reload this page for the latest status.
      </footer>
    </main>
  );
}
