import React, { createContext, useContext, useEffect, useRef, useState } from "react";


export type SidebarPosition = "left" | "right";
export type ContentWidth    = "full" | "contained";
export type SidebarNavStyle = "tree" | "flat";

export interface DashboardSettings {
  bgColor: string;
  sidebarVisible: boolean;
  sidebarPosition: SidebarPosition;
  sidebarBgColor: string;      
  sidebarNavStyle: SidebarNavStyle; 
  contentWidth: ContentWidth;
  compactMode: boolean;
  showWelcomeBar: boolean;
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  bgColor:         "#F8FAFC",
  sidebarVisible:  true,
  sidebarPosition: "left",
  sidebarBgColor:  "#7A0E42",
  sidebarNavStyle: "tree",
  contentWidth:    "contained",
  compactMode:     false,
  showWelcomeBar:  true,
};

const STORAGE_KEY = "skulcredit_admin_dashboard_settings";

export function loadSettings(): DashboardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: DashboardSettings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

interface SettingsCtx {
  settings: DashboardSettings;
  setSettings: (s: DashboardSettings) => void;
}

const DashboardSettingsContext = createContext<SettingsCtx>({
  settings:    DEFAULT_SETTINGS,
  setSettings: () => undefined,
});

export function useDashboardSettings(): SettingsCtx {
  return useContext(DashboardSettingsContext);
}

export const DashboardSettingsProvider: React.FC<{
  children: React.ReactNode;
  value: SettingsCtx;
}> = ({ children, value }) => (
  <DashboardSettingsContext.Provider value={value}>
    {children}
  </DashboardSettingsContext.Provider>
);

const BG_PRESETS = [
  { label: "Cloud",     value: "#F8FAFC" },
  { label: "Snow",      value: "#FFFFFF" },
  { label: "Warm grey", value: "#F5F5F4" },
  { label: "Cool grey", value: "#F1F5F9" },
  { label: "Blush",     value: "#FDF2F8" },
  { label: "Mint",      value: "#F0FDF4" },
  { label: "Sky",       value: "#F0F9FF" },
  { label: "Sand",      value: "#FFFBEB" },
];

const SIDEBAR_PRESETS = [
  { label: "Maroon",  value: "#7A0E42" },
  { label: "Slate",   value: "#1e293b" },
  { label: "Dark",    value: "#0f172a" },
  { label: "Forest",  value: "#14532d" },
  { label: "Ocean",   value: "#0c4a6e" },
  { label: "Indigo",  value: "#312e81" },
  { label: "Gray",    value: "#374151" },
  { label: "Coffee",  value: "#431407" },
];

const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SectionHead: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
      )}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none"
      style={{ width: 40, height: 22, backgroundColor: checked ? "#7A0E42" : "#d1d5db" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  </div>
);

const SwatchGrid: React.FC<{
  presets: { label: string; value: string }[];
  current: string;
  onPick: (v: string) => void;
}> = ({ presets, current, onPick }) => (
  <div className="grid grid-cols-4 gap-2 mb-3">
    {presets.map((p) => (
      <button
        key={p.value}
        onClick={() => onPick(p.value)}
        title={p.label}
        className={[
          "flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-colors",
          current === p.value ? "border-[#7A0E42]" : "border-gray-100 hover:border-gray-300",
        ].join(" ")}
      >
        <span
          className="w-8 h-8 rounded-md border border-gray-200 block"
          style={{ backgroundColor: p.value }}
        />
        <span className="text-[9px] text-gray-400 leading-none">{p.label}</span>
      </button>
    ))}
  </div>
);

const HexInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <span
      className="w-7 h-7 rounded-md border border-gray-200 shrink-0"
      style={{ backgroundColor: value }}
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={7}
      placeholder="#7A0E42"
      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#7A0E42] focus:ring-2 focus:ring-[#7A0E42]/10 font-mono"
    />
  </div>
);

interface Props {
  open: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onChange: (s: DashboardSettings) => void;
}

const DashboardSettingsDrawer: React.FC<Props> = ({
  open,
  onClose,
  settings,
  onChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", h); };
  }, [open, onClose]);

  const set = <K extends keyof DashboardSettings>(key: K, val: DashboardSettings[K]) => {
    const next = { ...settings, [key]: val };
    onChange(next);
    saveSettings(next);
  };

  const resetAll = () => { onChange(DEFAULT_SETTINGS); saveSettings(DEFAULT_SETTINGS); };

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Dashboard settings"
        className={[
          "fixed top-0 right-0 h-full w-[320px] max-w-full bg-white z-50 shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Dashboard Settings</h2>
            <p className="text-xs text-gray-400 mt-0.5">Customise your admin experience</p>
          </div>
          <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                  aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-brand">

          {/* ── Page background ── */}
          <section>
            <SectionHead label="Page Background" />
            <SwatchGrid presets={BG_PRESETS} current={settings.bgColor} onPick={(v) => set("bgColor", v)} />
            <HexInput value={settings.bgColor} onChange={(v) => set("bgColor", v)} />
          </section>

          <div className="h-px bg-gray-100" />

          {/* ── Sidebar appearance ── */}
          <section>
            <SectionHead label="Sidebar Colour" />
            <SwatchGrid presets={SIDEBAR_PRESETS} current={settings.sidebarBgColor} onPick={(v) => set("sidebarBgColor", v)} />
            <HexInput value={settings.sidebarBgColor} onChange={(v) => set("sidebarBgColor", v)} />
          </section>

          {/* ── Sidebar nav style ── */}
          <section>
            <SectionHead label="Sidebar Navigation" />
            <div className="flex gap-2">
              {(["tree", "flat"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => set("sidebarNavStyle", style)}
                  className={[
                    "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                    settings.sidebarNavStyle === style
                      ? "border-[#7A0E42] bg-[#7A0E42]/5"
                      : "border-gray-100 hover:border-gray-200",
                  ].join(" ")}
                >
                  {/* Mini preview */}
                  <div className="w-full flex flex-col gap-1">
                    <div className="h-2 rounded bg-gray-300 w-full" />
                    {style === "tree" && (
                      <>
                        <div className="h-2 rounded bg-gray-200 w-3/4 ml-3" />
                        <div className="h-2 rounded bg-gray-200 w-3/4 ml-3" />
                      </>
                    )}
                    <div className="h-2 rounded bg-gray-300 w-full" />
                    {style === "tree" && (
                      <div className="h-2 rounded bg-gray-200 w-3/4 ml-3" />
                    )}
                  </div>
                  <span className={[
                    "text-xs font-semibold capitalize",
                    settings.sidebarNavStyle === style ? "text-[#7A0E42]" : "text-gray-500",
                  ].join(" ")}>
                    {style === "tree" ? "Tree (expandable)" : "Flat (no sub-items)"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-gray-100" />

          {/* ── Layout toggles ── */}
          <section>
            <SectionHead label="Layout" />
            <Toggle
              checked={settings.sidebarVisible}
              onChange={(v) => set("sidebarVisible", v)}
              label="Show Sidebar"
              description="Hide to maximise content space"
            />
            <Toggle
              checked={settings.compactMode}
              onChange={(v) => set("compactMode", v)}
              label="Compact Mode"
              description="Reduce padding and spacing"
            />
            <Toggle
              checked={settings.showWelcomeBar}
              onChange={(v) => set("showWelcomeBar", v)}
              label="Welcome Bar"
              description="Show greeting text at top of page"
            />
          </section>

          {/* ── Sidebar position ── */}
          <section>
            <SectionHead label="Sidebar Position" />
            <div className="flex gap-2">
              {(["left", "right"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => set("sidebarPosition", pos)}
                  className={[
                    "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                    settings.sidebarPosition === pos
                      ? "border-[#7A0E42] bg-[#7A0E42]/5"
                      : "border-gray-100 hover:border-gray-200",
                  ].join(" ")}
                >
                  <div className="flex gap-1 w-full h-7">
                    {pos === "left" ? (
                      <>
                        <div className="w-3 h-full rounded" style={{ backgroundColor: settings.sidebarBgColor + "55" }} />
                        <div className="flex-1 h-full rounded bg-gray-100" />
                      </>
                    ) : (
                      <>
                        <div className="flex-1 h-full rounded bg-gray-100" />
                        <div className="w-3 h-full rounded" style={{ backgroundColor: settings.sidebarBgColor + "55" }} />
                      </>
                    )}
                  </div>
                  <span className={[
                    "text-xs font-semibold capitalize",
                    settings.sidebarPosition === pos ? "text-[#7A0E42]" : "text-gray-500",
                  ].join(" ")}>
                    {pos}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Content width ── */}
          <section>
            <SectionHead label="Content Width" />
            <div className="flex gap-2">
              {(["contained", "full"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => set("contentWidth", w)}
                  className={[
                    "flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors capitalize",
                    settings.contentWidth === w
                      ? "border-[#7A0E42] bg-[#7A0E42]/5 text-[#7A0E42]"
                      : "border-gray-100 text-gray-500 hover:border-gray-200",
                  ].join(" ")}
                >
                  {w}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={resetAll}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#7A0E42" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#5e0a31")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7A0E42")}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

export default DashboardSettingsDrawer;
