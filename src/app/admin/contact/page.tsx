"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/ui/alert-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AdminGuard from "../_components/AdminGuard";
import { createTablePDF } from "../_components/pdf";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

export default function AdminContactPage() {
  const [conStart, setConStart] = useState<Date | undefined>(undefined);
  const [conEnd, setConEnd] = useState<Date | undefined>(undefined);
  const [rows, setRows] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { show } = useAlert();

  const toCSV = (data: any[], headers: string[], filename: string) => {
    const esc = (v: unknown) => {
      const s = (v ?? "").toString();
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [headers.join(",")];
    for (const r of data) lines.push(headers.map((h) => esc((r as any)[h])).join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const toJSONFile = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("admin_list_contact_us", {
        start_ts: conStart ? conStart.toISOString() : null,
        end_ts: conEnd ? conEnd.toISOString() : null,
        limit_rows: 500,
        offset_rows: 0,
      });
      if (error) throw error;
      const r: any[] = Array.isArray(data) ? data : [];
      setRows(r);
      if (r.length === 0) show({ title: "No results", description: "No contact messages match the filters.", variant: "info" });
    } catch (e: any) {
      setError(e?.message || "Failed to load contact messages");
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!rows || rows.length === 0) { alert("Nothing to download. Load contact messages first."); return; }
    await createTablePDF(
      "Contact Messages",
      undefined,
      [
        { key: "created_at", label: "Created", w: 130 },
        { key: "first_name", label: "First Name", w: 120 },
        { key: "last_name", label: "Last Name", w: 120 },
        { key: "email", label: "Email", w: 220 },
        { key: "phone", label: "Phone", w: 120 },
        { key: "subject", label: "Subject", w: 160 },
        { key: "status", label: "Status", w: 100 },
      ],
      rows,
      `contact-messages`
    );
  };

  return (
    <AdminGuard>
      <main className="min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-center">Contact Messages</h1>
          <div className="mt-2 flex justify-between">
            <button onClick={() => router.push("/admin")} className="rounded border px-3 py-1.5">Back</button>
          </div>

          <div className="rounded-xl border p-6 space-y-4 bg-card/70 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="conStart">Start Date</label>
                <DatePicker 
                  id="conStart" 
                  date={conStart} 
                  onDateChange={setConStart} 
                  placeholder="Select start date" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="conEnd">End Date</label>
                <DatePicker 
                  id="conEnd" 
                  date={conEnd} 
                  onDateChange={setConEnd} 
                  placeholder="Select end date" 
                  fromDate={conStart}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2 flex-wrap">
              <button onClick={load} disabled={loading} className="rounded bg-black text-white px-4 py-2 hover:bg-gray-800 disabled:opacity-50">{loading ? "Loading…" : "Load Messages"}</button>
              <button onClick={()=> rows && toJSONFile(rows, `contact-messages${conStart||conEnd?`-${conStart?format(conStart,"yyyy-MM-dd"):""}-${conEnd?format(conEnd,"yyyy-MM-dd"):""}`:``}.json`)} className="rounded border px-4 py-2 hover:bg-gray-100">Download JSON</button>
              <button onClick={()=> rows && toCSV(rows, ["created_at","first_name","last_name","email","phone","subject","message","status"], `contact-messages${conStart||conEnd?`-${conStart?format(conStart,"yyyy-MM-dd"):""}-${conEnd?format(conEnd,"yyyy-MM-dd"):""}`:""}.csv`)} className="rounded border px-4 py-2 hover:bg-gray-100">Download CSV</button>
              <button onClick={downloadPDF} className="rounded border px-4 py-2 hover:bg-gray-100">Download PDF</button>
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            {Array.isArray(rows) && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm"><thead className="bg-muted/50"><tr>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Subject</th>
                  <th className="px-3 py-2 text-left font-medium">Message</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {rows.length === 0 ? (<tr><td className="px-3 py-3" colSpan={7}>No records.</td></tr>) : (
                    rows.map((r,i)=> (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{r.created_at?.slice(0,19).replace('T',' ')}</td>
                        <td className="px-3 py-2">{r.first_name} {r.last_name}</td>
                        <td className="px-3 py-2">{r.email}</td>
                        <td className="px-3 py-2">{r.phone}</td>
                        <td className="px-3 py-2">{r.subject}</td>
                        <td className="px-3 py-2 max-w-[320px] truncate" title={r.message}>{r.message}</td>
                        <td className="px-3 py-2">{r.status}</td>
                      </tr>
                    ))
                  )}
                </tbody></table>
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}


