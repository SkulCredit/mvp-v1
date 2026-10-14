import React, { useEffect, useRef, useState } from "react";
import { DrawerShell, Field, inputCls, selectCls, BRAND } from "./shared";

export interface SchoolFormData {
  schoolName: string;
  contactPerson: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  website?: string;
  population?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  status?: string;
  logoUrl?: string;
}

interface Errors { [k: string]: string }

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Partial<SchoolFormData>;
  onSave: (data: SchoolFormData) => Promise<void>;
  saving: boolean;
}

const NG_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

const SCHOOL_STATUSES = ["pending","under_review","approved","rejected"];

const isEdit = (d: Partial<SchoolFormData> | undefined) => !!d && !!d.schoolName;

const SchoolFormModal: React.FC<Props> = ({ open, onClose, initial, onSave, saving }) => {
  const editing = isEdit(initial);

  const blank: SchoolFormData = {
    schoolName: "", contactPerson: "", email: "", password: "", phoneNumber: "",
    website: "", population: "", addressStreet: "", addressCity: "",
    addressState: "", addressCountry: "Nigeria",
    bankName: "", bankAccountName: "", bankAccountNumber: "", status: "pending",
    logoUrl: "",
  };

  const [form, setForm] = useState<SchoolFormData>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({ ...blank, ...initial });
      setLogoPreview(initial?.logoUrl ?? null);
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof SchoolFormData>(k: K, v: SchoolFormData[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(p => ({ ...p, logoUrl: "Logo must be under 2 MB." }));
      return;
    }
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setForm(p => ({ ...p, logoUrl: base64 }));
      setErrors(p => { const n = { ...p }; delete n.logoUrl; return n; });
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.schoolName.trim())    e.schoolName    = "School name is required.";
    if (!form.contactPerson.trim()) e.contactPerson = "Contact person is required.";
    if (!editing) {
      if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                    e.email         = "Valid email is required.";
      if (!form.password)           e.password      = "Password is required.";
      if (form.password && form.password.length < 8)
                                    e.password      = "Password must be at least 8 characters.";
      if (!form.phoneNumber?.trim() || form.phoneNumber.trim().length < 10)
                                    e.phoneNumber   = "Valid phone number is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: SchoolFormData = { ...form };
    if (editing) {
      // On edit: keep email/phone (they're contact updates), remove password
      delete payload.password;
    }
    Object.keys(payload).forEach(k => {
      const key = k as keyof SchoolFormData;
      if (payload[key] === "") delete payload[key];
    });
    await onSave(payload);
  };

  const title    = editing ? "Edit School" : "Add School";
  const subtitle = editing ? "Update school account details" : "Register a new partner school";

  const ChevSvg = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button onClick={onClose} disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
        Cancel
      </button>
      <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}>
        {saving && (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {saving ? "Saving…" : editing ? "Save Changes" : "Register School"}
      </button>
    </div>
  );

  return (
    <DrawerShell open={open} onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      <div className="space-y-5">

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">School Logo <span className="font-normal text-gray-300">(optional)</span></p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0 overflow-hidden bg-gray-50">
              {logoPreview ? (
                <img src={logoPreview} alt="School logo" className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-300" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {logoUploading ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                )}
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => { setLogoPreview(null); setForm(p => ({ ...p, logoUrl: "" })); }}
                  className="text-xs font-medium text-red-500 hover:text-red-600 text-left"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-400">PNG, JPG or WebP · max 2 MB</p>
            </div>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
          </div>
          {errors.logoUrl && <p className="mt-1.5 text-xs text-red-500">{errors.logoUrl}</p>}
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">School Details</p>
          <div className="space-y-4">
            <Field label="School Name" required error={errors.schoolName}>
              <input value={form.schoolName} onChange={e => set("schoolName", e.target.value)}
                     placeholder="e.g. Greenfield Academy" className={inputCls(errors.schoolName)} />
            </Field>
            <Field label="Contact Person" required error={errors.contactPerson}>
              <input value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)}
                     placeholder="e.g. Mrs Adaeze Obi" className={inputCls(errors.contactPerson)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Website">
                <input value={form.website ?? ""} onChange={e => set("website", e.target.value)}
                       placeholder="https://school.edu.ng" className={inputCls()} />
              </Field>
              <Field label="Population">
                <input value={form.population ?? ""} onChange={e => set("population", e.target.value)}
                       placeholder="e.g. 800" className={inputCls()} />
              </Field>
            </div>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="h-px bg-gray-100" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login Account</p>
            <div className="space-y-4">
              <Field label="Email Address" required error={errors.email}>
                <input type="email" value={form.email ?? ""} onChange={e => set("email", e.target.value)}
                       placeholder="school@example.com" className={inputCls(errors.email)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone Number" required error={errors.phoneNumber}>
                  <input type="tel" value={form.phoneNumber ?? ""} onChange={e => set("phoneNumber", e.target.value)}
                         placeholder="08012345678" className={inputCls(errors.phoneNumber)} />
                </Field>
                <Field label="Password" required error={errors.password}>
                  <input type="password" value={form.password ?? ""} onChange={e => set("password", e.target.value)}
                         placeholder="Min 8 characters" className={inputCls(errors.password)} />
                </Field>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="h-px bg-gray-100" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Details</p>
            <div className="space-y-4">
              <Field label="Email Address">
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={e => set("email", e.target.value)}
                  placeholder="school@example.com"
                  className={inputCls()}
                />
              </Field>
              <Field label="Phone Number">
                <input
                  type="tel"
                  value={form.phoneNumber ?? ""}
                  onChange={e => set("phoneNumber", e.target.value)}
                  placeholder="08012345678"
                  className={inputCls()}
                />
              </Field>
            </div>
          </>
        )}

        <div className="h-px bg-gray-100" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Address</p>
        <div className="space-y-4">
          <Field label="Street Address">
            <input value={form.addressStreet ?? ""} onChange={e => set("addressStreet", e.target.value)}
                   placeholder="e.g. 12 Victoria Island Road" className={inputCls()} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <input value={form.addressCity ?? ""} onChange={e => set("addressCity", e.target.value)}
                     placeholder="e.g. Lagos" className={inputCls()} />
            </Field>
            <Field label="State">
              <div className="relative">
                <select value={form.addressState ?? ""} onChange={e => set("addressState", e.target.value)}
                        className={selectCls()}>
                  <option value="">— Select state —</option>
                  {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevSvg />
              </div>
            </Field>
          </div>
        </div>

        <div className="h-px bg-gray-100" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bank Account</p>
        <div className="space-y-4">
          <Field label="Bank Name">
            <input value={form.bankName ?? ""} onChange={e => set("bankName", e.target.value)}
                   placeholder="e.g. Access Bank" className={inputCls()} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Account Number">
              <input value={form.bankAccountNumber ?? ""} onChange={e => set("bankAccountNumber", e.target.value)}
                     placeholder="0123456789" maxLength={10} className={inputCls()} />
            </Field>
            <Field label="Account Name">
              <input value={form.bankAccountName ?? ""} onChange={e => set("bankAccountName", e.target.value)}
                     placeholder="School account name" className={inputCls()} />
            </Field>
          </div>
        </div>

        {editing && (
          <>
            <div className="h-px bg-gray-100" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
            <Field label="Approval Status">
              <div className="relative">
                <select value={form.status ?? "pending"} onChange={e => set("status", e.target.value)}
                        className={selectCls()}>
                  {SCHOOL_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
                <ChevSvg />
              </div>
            </Field>
          </>
        )}

      </div>
    </DrawerShell>
  );
};

export default SchoolFormModal;
