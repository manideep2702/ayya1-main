"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AnnaPassPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams(window.location.search);
        const id = String(sp.get("b") || sp.get("id") || "").trim();
        const token = String(sp.get("t") || sp.get("token") || "").trim();
        if (!token) {
          setError("Missing QR token");
          setLoading(false);
          return;
        }
        const supabase = getSupabaseBrowserClient();
        // Admin check (email in env)
        try {
          const { data: s } = await supabase.auth.getSession();
          const email = (s?.session?.user?.email || "").toLowerCase();
          const envRaw = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
          const allowed = envRaw.split(/[\s,;]+/).filter(Boolean);
          setIsAdmin(!!email && (allowed.length === 0 || allowed.includes(email)));
        } catch {}
        // Query by token using RPC (works for static export)
        const { data, error } = await supabase.rpc("lookup_annadanam_pass", { token });
        if (error) {
          setError(error.message || "Invalid or expired pass");
          setLoading(false);
          return;
        }
        const passRow: any = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
        if (!passRow) {
          setError("Invalid or expired pass");
          setLoading(false);
          return;
        }
        setRow(passRow);
      } catch (e: any) {
        setError(e?.message || "Failed to load pass");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function confirmAttendance() {
    if (!row) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("mark_annadanam_attended", { token: (new URLSearchParams(window.location.search)).get("t") });
      if (error) { setError(error.message || "Could not confirm"); return; }
      const updated: any = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
      if (updated) setRow(updated);
    } catch (e: any) {
      setError(e?.message || "Could not confirm");
    }
  }
  function goToScanner() {
    const ua = (navigator?.userAgent || "").toLowerCase();
    const isAndroid = ua.includes("android");
    const isIOS = ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod");
    const fallback = () => {
      try {
        window.location.assign("/admin/annadanam/scan");
      } catch {
        const a = document.createElement("a");
        a.href = "/admin/annadanam/scan";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    };
    // Give external app a moment; then fall back to in-app scanner
    const timer = setTimeout(fallback, 1200);
    try {
      if (isAndroid) {
        // Open Google Lens (will deep-link to the Google app if installed)
        window.location.href = "https://lens.google/";
      } else if (isIOS) {
        // Try Apple's Code Scanner (private scheme but widely supported on recent iOS)
        window.location.href = "x-apple-codescanner://";
      } else {
        fallback();
      }
    } catch {
      clearTimeout(timer);
      fallback();
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold">Annadanam Pass</h1>
        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
        {row && (
          <div className="mt-4 rounded-xl border bg-card/70 p-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Booking ID</div>
              <div className="font-mono text-xs">{row.id}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="text-sm">{row.name}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-sm">{row.email}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="text-sm">{row.date}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Session</div>
              <div className="text-sm">{row.session}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Qty</div>
              <div className="text-sm">{row.qty}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-sm">{row.status}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Attended</div>
              <div className="text-sm">{row.attended_at ? String(row.attended_at).slice(0,19).replace('T',' ') : "—"}</div>
            </div>
            {isAdmin && (
              <div className="pt-3 flex gap-3">
                {!row.attended_at && (
                  <button onClick={confirmAttendance} className="rounded border px-3 py-2">
                    Confirm Attendance (Admin)
                  </button>
                )}
                {row.attended_at && (
                  <button onClick={goToScanner} className="rounded bg-black text-white px-3 py-2">
                    Next (Lens / Code Scanner)
                  </button>
                )}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Show this pass to the admin volunteer at the Annadanam counter during your session time.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}


