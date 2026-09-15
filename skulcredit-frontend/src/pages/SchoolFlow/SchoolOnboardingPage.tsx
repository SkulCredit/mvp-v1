import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { schoolService } from "../../services/schoolService";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // School Information
  schoolName: string;
  yearFounded: string;
  population: string;
  schoolType: string;
  // Location Details
  address: string;
  cityLga: string;
  state: string;
  // Contact Information
  principalName: string;
  officialEmail: string;
  phoneNumber: string;
  altPhoneNumber: string;
  // Government Approval & Accreditation
  regNumber: string;
  accreditationType: string;
  accreditationBody: string;
}

// ── Shared small components ───────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand " +
  "hover:border-slate-300";

const Label: React.FC<{ text: string; required?: boolean }> = ({
  text,
  required,
}) => (
  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
    {text}
    {required && <span className="text-brand ml-0.5">*</span>}
  </label>
);

const SectionCard: React.FC<{
  icon: string;
  iconColor?: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, iconColor = "text-brand", title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
    <div className="flex items-center gap-2.5 mb-1">
      <Icon name={icon} className={`w-5 h-5 ${iconColor}`} />
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
);

// ── File upload component ─────────────────────────────────────────────────────

interface FileUploadProps {
  label: string;
  required?: boolean;
  file: File | null;
  url: string;
  uploading: boolean;
  error: string;
  onFileChange: (f: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  required,
  file,
  url,
  uploading,
  error,
  onFileChange,
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label text={label} required={required} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#7a1848] disabled:opacity-60 transition-colors shrink-0"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="upload-cloud" className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Upload File"}
        </button>

        {url ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Icon name="check-circle" className="w-4 h-4" />
            {file?.name ?? "Uploaded"}
          </span>
        ) : (
          <span className="text-xs text-slate-400">
            {file ? file.name : "No file chosen"}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
        }}
        disabled={uploading}
      />
    </div>
  );
};

// ── Success modal (shown after completeRegistration succeeds) ────────────────

const SuccessModal: React.FC<{ onDashboard: () => void }> = ({
  onDashboard,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="success-modal-title"
  >
    {/* backdrop */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

    <div className="relative w-full max-w-lg bg-white rounded-2xl border border-brand/30 shadow-2xl p-10 text-center animate-fade-in-up">
      <p className="text-5xl mb-4">🎉</p>

      <h2
        id="success-modal-title"
        className="text-xl font-bold text-brand mb-3"
      >
        Congratulations!
      </h2>

      <p className="text-sm font-semibold text-slate-700 mb-4">
        Your information has been submitted
      </p>

      <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
        Our team is currently reviewing your school's details. Approval may take
        24–48 hours. You can monitor your status and receive updates directly
        from your dashboard.
      </p>

      <button
        onClick={onDashboard}
        className="w-full max-w-xs mx-auto flex items-center justify-center bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-md shadow-brand/20"
      >
        Go to Dashboard
      </button>

      <p className="text-xs text-slate-400 mt-4">
        We'll notify you as soon as your school is approved
      </p>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const SchoolOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    accreditationBody: "",
  });

  // File upload state
  const [accredFile, setAccredFile] = useState<File | null>(null);
  const [accredUrl, setAccredUrl] = useState("");
  const [accredUploading, setAccredUploading] = useState(false);
  const [accredError, setAccredError] = useState("");

  const [addDocFile, setAddDocFile] = useState<File | null>(null);
  const [addDocUrl, setAddDocUrl] = useState("");
  const [addDocUploading, setAddDocUploading] = useState(false);
  const [addDocError, setAddDocError] = useState("");

  const upd = (field: keyof FormData, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  // Upload helper
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
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post("/upload/document", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrl(((res.data?.data?.url ?? res.data?.url) as string) ?? "");
    } catch (err) {
      setError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "File upload failed. Please try again.",
      );
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!accredUrl) {
      setSubmitError(
        "Please upload an accreditation document before submitting.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await schoolService.completeRegistration({
        website: undefined,
        population: form.population || undefined,
        addressStreet: form.address || undefined,
        addressCity: form.cityLga || undefined,
        addressState: form.state || undefined,
        addressCountry: "Nigeria",
        documentCac: accredUrl,
        documentLicense: addDocUrl || undefined,
        contactPerson: form.principalName || undefined,
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
    return <SuccessModal onDashboard={() => navigate("/school/dashboard")} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/logo_nav.png" alt="SkulCredit" className="h-8 w-auto" />
        </div>
        <button
          type="button"
          onClick={() => navigate("/school/dashboard")}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Icon name="arrow-left" className="w-4 h-4" />
          Back to Dashboard
        </button>
      </header>

      {/* ── Hero band ── */}
      <div className="bg-brand text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-1">Partner School Registration</h1>
        <p className="text-sm text-white/80 max-w-sm mx-auto">
          Join our network of verified educational institutions and help more
          students access quality education
        </p>
      </div>

      {/* ── Form ── */}
      <main className="flex-1 py-10 px-4 flex flex-col items-center">
        <form
          className="w-full max-w-xl space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          {submitError && (
            <div
              role="alert"
              className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium"
            >
              {submitError}
            </div>
          )}

          {/* ── Section 1: School Information ── */}
          <SectionCard
            icon="school"
            iconColor="text-brand"
            title="School Information"
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
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label text="Year Founded" required />
                <input
                  type="text"
                  placeholder="2010"
                  value={form.yearFounded}
                  onChange={(e) => upd("yearFounded", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="Student Population" required />
                <input
                  type="number"
                  placeholder="500"
                  min="1"
                  value={form.population}
                  onChange={(e) => upd("population", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="School Type" required />
                <input
                  type="text"
                  placeholder=""
                  value={form.schoolType}
                  onChange={(e) => upd("schoolType", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 2: Location Details ── */}
          <SectionCard
            icon="map-pin"
            iconColor="text-emerald-500"
            title="Location Details"
          >
            <div>
              <Label text="Complete Address" required />
              <textarea
                rows={3}
                placeholder="No. Street address, landmarks, etc."
                value={form.address}
                onChange={(e) => upd("address", e.target.value)}
                className={inputCls + " resize-none"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="City/LGA" required />
                <input
                  type="text"
                  placeholder="Ikeja"
                  value={form.cityLga}
                  onChange={(e) => upd("cityLga", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="State" required />
                <input
                  type="text"
                  placeholder="e.g Lagos"
                  value={form.state}
                  onChange={(e) => upd("state", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 3: Contact Information ── */}
          <SectionCard
            icon="user"
            iconColor="text-violet-500"
            title="Contact Information"
          >
            <div>
              <Label text="Principal/Head of School Name" required />
              <input
                type="text"
                placeholder="Full name"
                value={form.principalName}
                onChange={(e) => upd("principalName", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="Official Email Address" required />
                <input
                  type="email"
                  placeholder="principal@school.com"
                  value={form.officialEmail}
                  onChange={(e) => upd("officialEmail", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="Phone Number" required />
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
              <Label text="Alternate Phone Number" required />
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={form.altPhoneNumber}
                onChange={(e) => upd("altPhoneNumber", e.target.value)}
                className={inputCls}
              />
            </div>
          </SectionCard>

          {/* ── Section 4: Government Approval & Accreditation ── */}
          <SectionCard
            icon="file-text"
            iconColor="text-amber-500"
            title="Government Approval & Accreditation"
          >
            <div>
              <Label text="School Registration Number" required />
              <input
                type="text"
                placeholder="Official registration/approval number"
                value={form.regNumber}
                onChange={(e) => upd("regNumber", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="Accreditation/Approval Type" required />
                <input
                  type="text"
                  placeholder=""
                  value={form.accreditationType}
                  onChange={(e) => upd("accreditationType", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label text="Upload Accreditation Document" required />
                <input
                  type="text"
                  placeholder=""
                  value={form.accreditationBody}
                  onChange={(e) => upd("accreditationBody", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Primary accreditation doc upload */}
            <FileUpload
              label="Upload Accreditation Document"
              required
              file={accredFile}
              url={accredUrl}
              uploading={accredUploading}
              error={accredError}
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

            {/* Additional document */}
            {(addDocFile || addDocUrl) && (
              <FileUpload
                label="Additional Document"
                file={addDocFile}
                url={addDocUrl}
                uploading={addDocUploading}
                error={addDocError}
                onFileChange={(f) =>
                  uploadFile(
                    f,
                    setAddDocFile,
                    setAddDocUrl,
                    setAddDocUploading,
                    setAddDocError,
                  )
                }
              />
            )}

            {!addDocFile && !addDocUrl && (
              <button
                type="button"
                onClick={() => setAddDocFile(null)}
                className="text-xs text-brand font-semibold hover:underline"
              >
                + Add another document
              </button>
            )}
          </SectionCard>

          {/* ── Terms & Submit ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              I confirm that all information provided is accurate and that I am
              authorized to register this school. I understand that false
              information may result in rejection or termination of partnership.
            </p>
            <p className="text-xs text-slate-500 text-center">
              I agree to SkulCredit's{" "}
              <a href="#" className="text-brand font-semibold hover:underline">
                Terms of Partnership
              </a>{" "}
              and{" "}
              <a href="#" className="text-brand font-semibold hover:underline">
                Privacy Policy
              </a>
            </p>

            <button
              type="submit"
              disabled={isSubmitting || accredUploading || addDocUploading}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-full hover:bg-[#7a1848] transition-colors shadow-md shadow-brand/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Registration"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SchoolOnboardingPage;
