import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const BRAND = "#7A0E42";
export const PAGE_SIZES = [10, 25, 50];

export function initials(a: string, b: string) {
  return `${a[0] ?? ""}${b[0] ?? ""}`.toUpperCase();
}

export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

export function useDebounce<T>(value: T, ms = 400): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

export const Ic: React.FC<{ d: string | string[]; cls?: string }> = ({ d, cls = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

export const SearchIcon  = () => <Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" cls="w-4 h-4 text-gray-400 shrink-0" />;
export const ChevronDown = () => <Ic d="M6 9l6 6 6-6" cls="w-3.5 h-3.5 text-gray-400 shrink-0" />;
export const ChevronLeft  = () => <Ic d="M15 18l-6-6 6-6" cls="w-4 h-4" />;
export const ChevronRight = () => <Ic d="M9 18l6-6-6-6" cls="w-4 h-4" />;
export const ResetIcon   = () => <Ic d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" cls="w-3.5 h-3.5" />;
export const ViewIcon    = () => <Ic d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" cls="w-3.5 h-3.5" />;
export const EditIcon    = () => <Ic d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" cls="w-3.5 h-3.5" />;
export const DeleteIcon  = () => <Ic d={["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M10 11v6","M14 11v6","M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} cls="w-3.5 h-3.5" />;
export const CloseIcon   = () => <Ic d="M18 6L6 18M6 6l12 12" cls="w-4 h-4" />;
export const PlusIcon    = () => <Ic d="M12 5v14M5 12h14" cls="w-4 h-4" />;

export const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
  </svg>
);

export const Spinner: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    <td colSpan={cols} className="px-5 py-16 text-center">
      <div className="flex justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
             style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
      </div>
    </td>
  </tr>
);

export const EmptyRow: React.FC<{ cols: number; label: string }> = ({ cols, label }) => (
  <tr>
    <td colSpan={cols} className="px-5 py-16 text-center text-sm text-gray-400">{label}</td>
  </tr>
);

export const ErrorRow: React.FC<{ cols: number; message: string }> = ({ cols, message }) => (
  <tr>
    <td colSpan={cols} className="px-5 py-16 text-center text-sm text-red-500">{message}</td>
  </tr>
);

interface ActionsDropdownProps {
  onView: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}
export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, right: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const menuRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = btnRef.current!.getBoundingClientRect();
    // position: fixed uses viewport coords — no scrollY offset needed
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpen(v => !v);
  };

  const menu = open && createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: pos.top, right: pos.right, width: 192, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden py-1"
    >
      <button onClick={() => { setOpen(false); onView(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
        <ViewIcon /> View Profile
      </button>
      {onEdit && (
        <button onClick={() => { setOpen(false); onEdit(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
          <EditIcon /> Edit
        </button>
      )}
      <div className="h-px bg-gray-100 mx-3 my-1" />
      <button onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
        <DeleteIcon /> Delete
      </button>
    </div>,
    document.body,
  );

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Actions"
        aria-expanded={open}
      >
        <DotsIcon />
      </button>
      {menu}
    </div>
  );
};

export const Pagination: React.FC<{
  meta: { total: number; page: number; limit: number };
  page: number;
  totalPages: number;
  label: string;
  onPage: (p: number) => void;
}> = ({ meta, page, totalPages, label, onPage }) => (
  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 gap-4 flex-wrap">
    <p className="text-xs text-gray-500 shrink-0">
      Showing{" "}
      <span className="font-semibold text-gray-700">
        {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
      </span>{" "}
      of <span className="font-semibold text-gray-700">{meta.total}</span> {label}
    </p>
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft />
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        let pg = i + 1;
        if (totalPages > 5) {
          if (page <= 3) pg = i + 1;
          else if (page >= totalPages - 2) pg = totalPages - 4 + i;
          else pg = page - 2 + i;
        }
        return (
          <button key={pg} onClick={() => onPage(pg)}
                  className={["w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                    pg === page ? "text-white" : "text-gray-600 hover:bg-gray-50 border border-gray-200"].join(" ")}
                  style={pg === page ? { backgroundColor: BRAND } : {}}>
            {pg}
          </button>
        );
      })}
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight />
      </button>
    </div>
  </div>
);

export const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({
  label, required, error, children,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white placeholder-gray-400
   focus:ring-2 focus:ring-[#7A0E42]/15 focus:border-[#7A0E42]
   ${err ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"}`;

export const selectCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white appearance-none cursor-pointer
   focus:ring-2 focus:ring-[#7A0E42]/15 focus:border-[#7A0E42]
   ${err ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"}`;

export const DrawerShell: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  width?: string;
}> = ({ open, onClose, title, subtitle, children, footer, width = "w-[520px]" }) => {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <>
      <div className={["fixed inset-0 z-40 bg-black/30 transition-opacity duration-300",
                       open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"].join(" ")}
           onClick={onClose} aria-hidden="true" />
      <div className={["fixed top-0 right-0 h-full max-w-full bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out",
                       width, open ? "translate-x-0" : "translate-x-full"].join(" ")}
           role="dialog" aria-label={title}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-brand">
          {children}
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-gray-100">
          {footer}
        </div>
      </div>
    </>
  );
};
