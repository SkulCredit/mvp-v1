import React, { useEffect, useState } from "react";
import { DrawerShell, Field, inputCls, selectCls, BRAND } from "./shared";

export interface ParentFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  kycStatus?: string;
  relationship?: string;
  employerType?: string;
  monthlyIncome?: string;
}

interface Errors { [k: string]: string }

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Partial<ParentFormData>;
  onSave: (data: ParentFormData) => Promise<void>;
  saving: boolean;
}

const RELATIONSHIPS   = ["Parent", "Guardian", "Sponsor"];
const EMPLOYER_TYPES  = ["Employed (Private)", "Employed (Government)", "Self-employed", "Business Owner", "Freelancer", "Other"];
const INCOME_RANGES   = ["₦50,000 – ₦100,000", "₦100,001 – ₦250,000", "₦250,001 – ₦500,000", "₦500,001 – ₦1,000,000", "Above ₦1,000,000"];
const KYC_STATUSES    = ["pending", "submitted", "approved", "rejected"];

const isEdit = (d: Partial<ParentFormData> | undefined) => !!d && !!d.email;

const ParentFormModal: React.FC<Props> = ({ open, onClose, initial, onSave, saving }) => {
  const editing = isEdit(initial);

  const blank: ParentFormData = {
    firstName: "", lastName: "", email: "", password: "",
    phoneNumber: "", kycStatus: "pending", relationship: "", employerType: "", monthlyIncome: "",
  };

  const [form, setForm] = useState<ParentFormData>(blank);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setForm({ ...blank, ...initial });
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof ParentFormData>(k: K, v: ParentFormData[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.firstName.trim())     e.firstName   = "First name is required.";
    if (!form.lastName.trim())      e.lastName    = "Last name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                    e.email       = "Valid email is required.";
    if (!editing && !form.password) e.password    = "Password is required.";
    if (!editing && form.password && form.password.length < 8)
                                    e.password    = "Password must be at least 8 characters.";
    if (!form.phoneNumber.trim() || form.phoneNumber.trim().length < 10)
                                    e.phoneNumber = "Valid phone number is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: ParentFormData = editing
      ? { ...form, password: "" }
      : { ...form };
    await onSave(payload);
  };

  const title    = editing ? "Edit Parent" : "Add Parent";
  const subtitle = editing ? "Update parent account details" : "Create a new parent account";

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
        {saving ? "Saving…" : editing ? "Save Changes" : "Create Parent"}
      </button>
    </div>
  );

  return (
    <DrawerShell open={open} onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      <div className="space-y-5">

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account Details</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.firstName}>
              <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                     placeholder="e.g. Amaka" className={inputCls(errors.firstName)} />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                     placeholder="e.g. Johnson" className={inputCls(errors.lastName)} />
            </Field>
          </div>
        </div>

        <Field label="Email Address" required error={errors.email}>
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                 placeholder="amaka@example.com" disabled={editing}
                 className={inputCls(errors.email) + (editing ? " opacity-60 cursor-not-allowed" : "")} />
        </Field>

        <Field label="Phone Number" required error={errors.phoneNumber}>
          <input type="tel" value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)}
                 placeholder="08012345678" className={inputCls(errors.phoneNumber)} />
        </Field>

        {!editing && (
          <Field label="Password" required error={errors.password}>
            <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                   placeholder="Min 8 characters" className={inputCls(errors.password)} />
          </Field>
        )}

        <div className="h-px bg-gray-100" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile</p>

        <Field label="Relationship to Student">
          <div className="relative">
            <select value={form.relationship ?? ""} onChange={e => set("relationship", e.target.value)}
                    className={selectCls()}>
              <option value="">— Select —</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </Field>

        <Field label="Employer / Business Type">
          <div className="relative">
            <select value={form.employerType ?? ""} onChange={e => set("employerType", e.target.value)}
                    className={selectCls()}>
              <option value="">— Select —</option>
              {EMPLOYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </Field>

        <Field label="Monthly Income Range">
          <div className="relative">
            <select value={form.monthlyIncome ?? ""} onChange={e => set("monthlyIncome", e.target.value)}
                    className={selectCls()}>
              <option value="">— Select —</option>
              {INCOME_RANGES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </Field>

        {editing && (
          <>
            <div className="h-px bg-gray-100" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">KYC</p>
            <Field label="KYC Status">
              <div className="relative">
                <select value={form.kycStatus ?? "pending"} onChange={e => set("kycStatus", e.target.value)}
                        className={selectCls()}>
                  {KYC_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </Field>
          </>
        )}
      </div>
    </DrawerShell>
  );
};

export default ParentFormModal;
