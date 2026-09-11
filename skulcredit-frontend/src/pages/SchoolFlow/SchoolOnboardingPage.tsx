import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { AppFlowHeader } from "../../components/layout";
import { schoolService } from "../../services/schoolService";
import apiClient from "../../services/apiClient";
import { AxiosError } from "axios";

interface Step1Form {
  contactPerson: string;
  website: string;
  population: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
}

const SchoolOnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const [step1, setStep1] = useState<Step1Form>({
    contactPerson: "",
    website: "",
    population: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressCountry: "Nigeria",
  });

  const [cacFile, setCacFile] = useState<File | null>(null);
  const [cacUrl, setCacUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleCacUpload = async (file: File | undefined) => {
    if (!file) return;
    setCacFile(file);
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient.post("/upload/document", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCacUrl(((res.data?.data?.url ?? res.data?.url) as string) ?? "");
    } catch (err) {
      setUploadError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "File upload failed.",
      );
      setCacFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!cacUrl) {
      setSubmitError("Please upload the CAC / School Licence document first.");
      return;
    }
    setIsSubmitting(true);
    try {
      await schoolService.completeRegistration({
        contactPerson: step1.contactPerson || undefined,
        website: step1.website || undefined,
        population: step1.population || undefined,
        addressStreet: step1.addressStreet || undefined,
        addressCity: step1.addressCity || undefined,
        addressState: step1.addressState || undefined,
        addressCountry: step1.addressCountry || undefined,
        documentCac: cacUrl,
      });
      navigate("/school/dashboard?status=pending");
    } catch (err) {
      const ax = err as AxiosError<{
        errors?: { message: string }[];
        message?: string;
      }>;
      setSubmitError(
        ax.response?.data?.errors?.[0]?.message ??
          ax.response?.data?.message ??
          "Failed to submit onboarding details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm";

  /* ── Header slots ── */
  const securityBadge = (
    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
      <Icon name="shield" className="w-4 h-4 text-emerald-500" />
      <span>Secure Onboarding</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AppFlowHeader center={securityBadge} />

      <main className="flex-1 py-10 px-4 md:px-8 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-[2rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col relative min-h-[600px]">
          {/* Progress header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Submit School Information
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Provide your institution's details
                </p>
              </div>
              <div className="text-sm font-bold text-brand bg-brand-50 px-3 py-1 rounded-lg border border-brand/10">
                Step {step} of 2
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-8 flex-1 relative overflow-y-auto">
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl font-medium border border-red-100">
                {submitError}
              </div>
            )}

            {/* ── Step 1: School details ── */}
            {step === 1 && (
              <form
                id="step-1"
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Contact Person*
                    </label>
                    <input
                      type="text"
                      placeholder="Full Name of primary contact"
                      required
                      value={step1.contactPerson}
                      onChange={(e) =>
                        setStep1({ ...step1, contactPerson: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Website / Social Media
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourschool.edu.ng"
                      value={step1.website}
                      onChange={(e) =>
                        setStep1({ ...step1, website: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      School Population
                    </label>
                    <input
                      type="number"
                      placeholder="Estimated total students"
                      min="10"
                      value={step1.population}
                      onChange={(e) =>
                        setStep1({ ...step1, population: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 School Road"
                      value={step1.addressStreet}
                      onChange={(e) =>
                        setStep1({ ...step1, addressStreet: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Lagos"
                      value={step1.addressCity}
                      onChange={(e) =>
                        setStep1({ ...step1, addressCity: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="Lagos State"
                      value={step1.addressState}
                      onChange={(e) =>
                        setStep1({ ...step1, addressState: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <button type="submit" id="submit-step-1" className="hidden" />
              </form>
            )}

            {/* ── Step 2: Document upload ── */}
            {step === 2 && (
              <form
                id="step-2"
                className="space-y-6"
                onSubmit={handleFinalSubmit}
              >
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                  <Icon
                    name="info"
                    className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-blue-800 font-medium">
                    Please upload clear, legible copies of your official
                    documents. PDFs or high-quality images (PNG, JPG) are
                    accepted.
                  </p>
                </div>
                {uploadError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                    {uploadError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    CAC / School Licence Upload*
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 bg-white transition-colors">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">
                          Uploading…
                        </p>
                      </div>
                    ) : cacUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          name="check-circle"
                          className="w-8 h-8 text-emerald-500"
                        />
                        <p className="text-sm font-bold text-slate-700">
                          {cacFile?.name}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">
                          Upload complete
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center px-4">
                        <Icon
                          name="upload-cloud"
                          className="w-8 h-8 text-brand mb-2"
                        />
                        <p className="text-sm text-slate-600 font-bold mb-1">
                          Click or drag & drop to upload
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          PDF, JPG, PNG up to 5MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleCacUpload(e.target.files?.[0])}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <button type="submit" id="submit-step-2" className="hidden" />
              </form>
            )}
          </div>

          {/* Footer controls */}
          <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-between rounded-b-[2rem]">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className={`flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
            >
              <Icon name="arrow-left" className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() =>
                (
                  document.getElementById(
                    `submit-step-${step}`,
                  ) as HTMLButtonElement | null
                )?.click()
              }
              disabled={isSubmitting || uploading}
              className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting
                ? "Submitting…"
                : step === 2
                  ? "Submit Application"
                  : "Continue"}
              {!isSubmitting && <Icon name="arrow-right" className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchoolOnboardingPage;
