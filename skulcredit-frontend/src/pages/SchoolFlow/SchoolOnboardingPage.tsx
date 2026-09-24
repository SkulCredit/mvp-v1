import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { schoolService } from "../../services/schoolService";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const SCHOOL_TYPES = [
  "Primary School",
  "Secondary School",
  "Primary & Secondary",
  "Tertiary Institution",
  "Vocational / Technical",
];

const ACCREDITATION_TYPES = [
  "Federal Ministry of Education",
  "State Ministry of Education",
  "WAEC Accredited",
  "NECO Accredited",
  "NABTEB Accredited",
  "NUC (University)",
  "NCCE (College of Education)",
  "NBTE (Polytechnic)",
  "Other",
];

interface FormData {
  schoolName: string;
  yearFounded: string;
  population: string;
  schoolType: string;
  address: string;
  cityLga: string;
  state: string;
  principalName: string;
  officialEmail: string;
  phoneNumber: string;
  altPhoneNumber: string;
  regNumber: string;
  accreditationType: string;
  website: string;
}

interface FormErrors {
  schoolName?: string;
  population?: string;
  address?: string;
  cityLga?: string;
  state?: string;
  principalName?: string;
  accredDoc?: string;
  terms?: string;
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand " +
  "hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400";

const selectCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 " +
  "outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand " +
  "hover:border-slate-300 appearance-none cursor-pointer";

const Label: React.FC<{ text: string; required?: boolean }> = ({
  text,
  required,
}) => (
  <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide">
    {text}
    {required && <span className="text-brand ml-0.5">*</span>}
  </label>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1.5 font-medium">{msg}</p> : null;

const StepBadge: React.FC<{ n: number; color: string }> = ({ n, color }) => (
  <div
    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${color}`}
  >
    {n}
  </div>
);

const SectionCard: React.FC<{
  step: number;
  stepColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ step, stepColor, title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
      <StepBadge n={step} color={stepColor} />
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="px-6 py-5 space-y-4">{children}</div>
  </div>
);

interface UploadFieldProps {
  label: string;
  required?: boolean;
  file: File | null;
  url: string;
  uploading: boolean;
  error: string;
  hint?: string;
  onFileChange: (f: File) => void;
}

const UploadField: React.FC<UploadFieldProps> = ({
  label,
  required,
  file,
  url,
  uploading,
  error,
  hint,
  onFileChange,
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label text={label} required={required} />
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      <div
        onClick={() => !uploading && ref.current?.click()}
        className={`relative flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 cursor-pointer transition-all ${
          url
            ? "border-emerald-300 bg-emerald-50/60"
            : uploading
              ? "border-brand/40 bg-brand/5"
              : "border-slate-200 bg-slate-50/40 hover:border-brand/50 hover:bg-brand/5"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${url ? "bg-emerald-100" : "bg-white border border-slate-200"}`}
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          ) : url ? (
            <svg
              className="w-4.5 h-4.5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="w-4.5 h-4.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {url ? (
            <p className="text-sm font-semibold text-emerald-700 truncate">
              {file?.name ?? "File uploaded"}
            </p>
          ) : uploading ? (
            <p className="text-sm font-medium text-brand">Uploading file…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">
                {file ? file.name : "Click to upload file"}
              </p>
              <p className="text-xs text-slate-400">
                PDF, JPG or PNG · Max 5MB
              </p>
            </>
          )}
        </div>
        {url && (
          <span className="shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            Uploaded
          </span>
        )}
        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
      )}
    </div>
  );
};

const SuccessPage: React.FC<{ onDashboard: () => void }> = ({
  onDashboard,
}) => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center">
      <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
    </header>
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand/20 shadow-xl p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🎉</span>
        </div>

        <h2 className="text-xl font-bold text-brand mb-2">Congratulations!</h2>
        <p className="text-sm font-semibold text-slate-700 mb-3">
          Your information has been submitted
        </p>
        <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-xs mx-auto">
          Our team is currently reviewing your school's details. Approval may
          take 24–48 hours. You can monitor your status and receive updates
          directly from your dashboard.
        </p>

        <button
          onClick={onDashboard}
          className="w-full bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-lg shadow-brand/25"
        >
          Go to Dashboard
        </button>
        <p className="text-xs text-slate-400 mt-3">
          We'll notify you as soon as your school is approved
        </p>
      </div>
    </div>
  </div>
);

const SchoolOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormData>({
    schoolName: "",
    yearFounded: "",
    population: "",
    schoolType: "",
    address: "",
    cityLga: "",
    state: "",
    principalName: "",
    officialEmail: "",
    phoneNumber: "",
    altPhoneNumber: "",
    regNumber: "",
    accreditationType: "",
    website: "",
  });

  const [accredFile, setAccredFile] = useState<File | null>(null);
  const [accredUrl, setAccredUrl] = useState("");
  const [accredUploading, setAccredUploading] = useState(false);
  const [accredError, setAccredError] = useState("");

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licenseError, setLicenseError] = useState("");

  const upd = (field: keyof FormData, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const uploadFile = async (
    file: File,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setUrl: React.Dispatch<React.SetStateAction<string>>,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setFile(file);
    setError("");
    setUploading(true);
    try {
      const fd = new globalThis.FormData();
      fd.append("file", file);
      const res = await apiClient.post("/upload/document", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrl(((res.data?.data?.url ?? res.data?.url) as string) ?? "");
    } catch (err) {
      setError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Upload failed. Please try again.",
      );
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.schoolName.trim()) e.schoolName = "School name is required.";
    if (!form.population.trim())
      e.population = "Student population is required.";
    if (!form.address.trim()) e.address = "School address is required.";
    if (!form.cityLga.trim()) e.cityLga = "City / LGA is required.";
    if (!form.state) e.state = "Please select a state.";
    if (!form.principalName.trim())
      e.principalName = "Principal name is required.";
    if (!accredUrl) e.accredDoc = "Please upload the accreditation document.";
    if (!termsChecked) e.terms = "You must agree to the terms to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await schoolService.completeRegistration({
        contactPerson: form.principalName || undefined,
        website: form.website || undefined,
        population: form.population || undefined,
        addressStreet: form.address || undefined,
        addressCity: form.cityLga || undefined,
        addressState: form.state || undefined,
        addressCountry: "Nigeria",
        documentCac: accredUrl,
        documentLicense: licenseUrl || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const ax = err as AxiosError<{
        errors?: { message: string }[];
        message?: string;
      }>;
      setSubmitError(
        ax.response?.data?.errors?.[0]?.message ??
          ax.response?.data?.message ??
          "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <SuccessPage onDashboard={() => navigate("/school/dashboard")} />;
  }

  const anyUploading = accredUploading || licenseUploading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
        <button
          type="button"
          onClick={() => navigate("/school/dashboard")}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Dashboard
        </button>
      </header>

      <div className="bg-gradient-to-br from-brand to-[#6b1240] text-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Partner School Registration
          </h1>
          <p className="text-sm text-white/75 max-w-sm mx-auto leading-relaxed">
            Complete your school profile to join our network of verified
            educational institutions and start receiving tuition disbursements.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            {["School Info", "Location", "Contact", "Accreditation"].map(
              (s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <span className="text-xs text-white/80 font-medium hidden sm:inline">
                    {s}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 px-4 flex flex-col items-center">
        <form
          className="w-full max-w-2xl space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl"
            >
              <svg
                className="w-4 h-4 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          <SectionCard
            step={1}
            stepColor="bg-brand"
            title="School Information"
            subtitle="Basic details about your institution"
          >
            <div>
              <Label text="Name of School" required />
              <input
                type="text"
                placeholder="Enter complete school name"
                value={form.schoolName}
                onChange={(e) => upd("schoolName", e.target.value)}
                className={inputCls}
              />
              <FieldError msg={errors.schoolName} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label text="Year Founded" />
                <input
                  type="number"
                  placeholder="e.g. 2005"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={form.yearFounded}
                  onChange={(e) => upd("yearFounded", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="Student Population" required />
                <input
                  type="number"
                  placeholder="e.g. 500"
                  min="1"
                  value={form.population}
                  onChange={(e) => upd("population", e.target.value)}
                  className={inputCls}
                />
                <FieldError msg={errors.population} />
              </div>
              <div>
                <Label text="School Type" />
                <div className="relative">
                  <select
                    value={form.schoolType}
                    onChange={(e) => upd("schoolType", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select type</option>
                    {SCHOOL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label text="School Website" />
              <input
                type="url"
                placeholder="https://yourschool.edu.ng"
                value={form.website}
                onChange={(e) => upd("website", e.target.value)}
                className={inputCls}
              />
            </div>
          </SectionCard>

          <SectionCard
            step={2}
            stepColor="bg-emerald-500"
            title="Location Details"
            subtitle="Where is your school located?"
          >
            <div>
              <Label text="Complete Address" required />
              <textarea
                rows={2}
                placeholder="No., Street address, nearest landmark…"
                value={form.address}
                onChange={(e) => upd("address", e.target.value)}
                className={inputCls + " resize-none"}
              />
              <FieldError msg={errors.address} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label text="City / LGA" required />
                <input
                  type="text"
                  placeholder="e.g. Ikeja"
                  value={form.cityLga}
                  onChange={(e) => upd("cityLga", e.target.value)}
                  className={inputCls}
                />
                <FieldError msg={errors.cityLga} />
              </div>
              <div>
                <Label text="State" required />
                <div className="relative">
                  <select
                    value={form.state}
                    onChange={(e) => upd("state", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>
                <FieldError msg={errors.state} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step={3}
            stepColor="bg-violet-500"
            title="Contact Information"
            subtitle="Who should we reach at your school?"
          >
            <div>
              <Label text="Principal / Head of School Name" required />
              <input
                type="text"
                placeholder="Full name"
                value={form.principalName}
                onChange={(e) => upd("principalName", e.target.value)}
                className={inputCls}
              />
              <FieldError msg={errors.principalName} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label text="Official Email Address" />
                <input
                  type="email"
                  placeholder="principal@school.edu.ng"
                  value={form.officialEmail}
                  onChange={(e) => upd("officialEmail", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="Phone Number" />
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.phoneNumber}
                  onChange={(e) => upd("phoneNumber", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <Label text="Alternate Phone Number" />
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={form.altPhoneNumber}
                onChange={(e) => upd("altPhoneNumber", e.target.value)}
                className={inputCls}
              />
            </div>
          </SectionCard>

          <SectionCard
            step={4}
            stepColor="bg-amber-500"
            title="Government Approval & Accreditation"
            subtitle="Official documents confirming your school's status"
          >
            <div>
              <Label text="School Registration / CAC Number" />
              <input
                type="text"
                placeholder="Official registration or approval number"
                value={form.regNumber}
                onChange={(e) => upd("regNumber", e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <Label text="Accreditation / Approval Type" />
              <div className="relative">
                <select
                  value={form.accreditationType}
                  onChange={(e) => upd("accreditationType", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select accreditation type</option>
                  {ACCREDITATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>

            <UploadField
              label="CAC / Accreditation Document"
              required
              hint="Upload your Certificate of Incorporation, operating license, or ministry approval letter"
              file={accredFile}
              url={accredUrl}
              uploading={accredUploading}
              error={accredError || (errors.accredDoc ?? "")}
              onFileChange={(f) =>
                uploadFile(
                  f,
                  setAccredFile,
                  setAccredUrl,
                  setAccredUploading,
                  setAccredError,
                )
              }
            />

            <UploadField
              label="Additional Supporting Document"
              hint="Optional — WAEC affiliation letter, government license, or any other supporting document"
              file={licenseFile}
              url={licenseUrl}
              uploading={licenseUploading}
              error={licenseError}
              onFileChange={(f) =>
                uploadFile(
                  f,
                  setLicenseFile,
                  setLicenseUrl,
                  setLicenseUploading,
                  setLicenseError,
                )
              }
            />
          </SectionCard>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                I confirm that all information provided is accurate and that I
                am authorized to register this school. I understand that false
                information may result in rejection or termination of
                partnership.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0 border-2 transition-colors ${termsChecked ? "bg-brand border-brand" : "border-slate-300 group-hover:border-brand/60"}`}
              >
                {termsChecked && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to SkulCredit's{" "}
                <a
                  href="#"
                  className="text-brand font-semibold hover:underline"
                >
                  Terms of Partnership
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-brand font-semibold hover:underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.terms && <FieldError msg={errors.terms} />}

            <button
              type="submit"
              disabled={isSubmitting || anyUploading}
              className="w-full bg-brand text-white font-bold py-4 rounded-full hover:bg-[#7a1848] transition-colors shadow-lg shadow-brand/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Registration…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Submit Registration
                </>
              )}
            </button>
          </div>
        </form>
        <p className="text-xs text-slate-400 text-center mt-6 mb-8">
          Your information is encrypted and securely stored.
        </p>
      </main>
    </div>
  );
};

export default SchoolOnboardingPage;
