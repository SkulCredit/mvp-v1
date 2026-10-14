import React, { useCallback, useEffect, useState } from "react";
import apiClient from "../../services/apiClient";

const BRAND = "#7A0E42";
const PAGE_SIZES = [10, 25, 50];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function useDebounce<T>(value: T, ms = 400): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

type SchoolStatus = "pending" | "active" | "suspended" | "rejected";

interface School {
  id: string;
  name: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  status: SchoolStatus;
  createdAt: string;
  user: { email: string; phoneNumber: string | null; isActive: boolean } | null;
}

interface PageMeta { total: number; page: number; limit: number; }

const STATUS_CFG: Record<SchoolStatus, { bg: string; text: string; label: string }> = {
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  label: "Pending"   },
  active:    { bg: "bg-green-50",  text: "text-green-700",  label: "Active"    },
  suspended: { bg: "bg-red-50",    text: "text-red-600",    label: "Suspended" },
  rejected:  { bg: "bg-gray-100",  text: "text-gray-600",   label: "Rejected"  },
};

const MOCK: School[] = [];


const CSSchoolsPage: React.FC = () => {
  const [schools,  setSchools]  = useState<School[]>([]);
  const [meta,     setMeta]     = useState<PageMeta>({ total: 0, page: 1, limit: 10 });
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page,     setPage]     = useState(1);

  const dSearch = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(pageSize),
        ...(dSearch && { search: dSearch }),
        ...(status  && { status }),
      });
      const res = await apiClient.get<{ data: School[] }>(`/cs/schools?${params}`);
      const rows = res.data.data ?? [];
      const filtered = rows.filter(s => {
        const ms  = !dSearch || (s.name ?? '').toLowerCase().includes(dSearch.toLowerCase()) || (s.user?.email ?? '').toLowerCase().includes(dSearch.toLowerCase());
        const mst = !status  || s.status === status;
        return ms && mst;
      });
      setSchools(filtered.slice((page - 1) * pageSize, page * pageSize));
      setMeta({ total: filtered.length, page, limit: pageSize });
    } catch {
      setSchools([]);
      setMeta({ total: 0, page, limit: pageSize });
    } finally {
      setLoading(false);
    }
  }, [dSearch, status, page, pageSize]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dSearch, status, pageSize]);

  const totalPages = Math.ceil(meta.total / pageSize) || 1;

  const initials = (name: string | null | undefined) => (name ?? '?').split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || '?';

  return (
    <div className="pt-6 pb-12 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schools</h1>
          <p className="text-sm text-gray-500 mt-0.5">View all registered schools. Read-only access.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" cls="w-3.5 h-3.5" />
          View only — contact admin to modify
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["active","pending","suspended","rejected"] as SchoolStatus[]).map(s => {
          const count = schools.filter(sc => sc.status === s).length;
          const cfg   = STATUS_CFG[s];
          return (
            <button key={s} onClick={() => setStatus(status === s ? "" : s)}
                    className={`p-3 rounded-xl border text-left transition-colors ${status === s ? `${cfg.bg} border-current/20` : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"}`}>
              <p className={`text-2xl font-bold ${status === s ? cfg.text : "text-gray-800"}`}>{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${status === s ? cfg.text : "text-gray-500"}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" cls="w-4 h-4 text-gray-400 shrink-0" />
            <input className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
                   placeholder="Search by school name or email..."
                   value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer">
            <option value="">All Status</option>
            {(Object.entries(STATUS_CFG) as [SchoolStatus, {label:string}][]).map(([k,v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none cursor-pointer">
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
          <button onClick={() => { setSearch(""); setStatus(""); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <Ic d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" cls="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["School","Email","Phone","State / LGA","Status","Joined"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : schools.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">No schools found.</td></tr>
              ) : schools.map(school => {
                const cfg = STATUS_CFG[school.status] ?? STATUS_CFG.pending;
                return (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                             style={{ backgroundColor: BRAND }}>
                          {initials(school.name)}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{school.name ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{school.user?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{school.user?.phoneNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {school.state ?? "—"}{school.lga ? ` / ${school.lga}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(school.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page - 1) * pageSize + 1, meta.total)}–{Math.min(page * pageSize, meta.total)} of {meta.total} schools
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(pg => (
              <button key={pg} onClick={() => setPage(pg)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === pg ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      style={page === pg ? { backgroundColor: BRAND } : {}}>
                {pg}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <Ic d="M9 18l6-6-6-6" cls="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSSchoolsPage;
