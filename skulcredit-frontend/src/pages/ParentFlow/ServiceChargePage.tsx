import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { AppFlowHeader } from "../../components/layout";
import { paymentService } from "../../services/paymentService";
import { parentService } from "../../services/parentService";
import { AxiosError } from "axios";

interface StudentDetails {
  studentName?: string;
  schoolName?: string;
  schoolId?: string;
  amount?: number | string;
  applicationId?: string;
}

const ServiceChargePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [loadingApp, setLoadingApp] = useState(false);

  // Try to get applicationId from URL query param first, then from localStorage
  const urlApplicationId = searchParams.get("applicationId");

  const storedDetails: StudentDetails = JSON.parse(
    localStorage.getItem("studentDetails") ?? "{}",
  );

  const [applicationData, setApplicationData] = useState<{
    id: string;
    referenceNumber?: string;
    amountRequested: number;
    serviceChargeAmount: number | null;
    serviceChargeRate: number | null;
    student?: { firstName?: string; lastName?: string };
    catalogSchool?: { name?: string };
    tenor?: number;
  } | null>(null);

  const effectiveApplicationId =
    urlApplicationId ?? storedDetails.applicationId;

  useEffect(() => {
    if (!effectiveApplicationId) return;
    setLoadingApp(true);
    (parentService.getApplicationDetails as (id: string) => Promise<unknown>)(
      effectiveApplicationId,
    )
      .then((data) => {
        const d = data as {
          id: string;
          referenceNumber?: string;
          amountRequested?: number;
          serviceChargeAmount?: number | null;
          serviceChargeRate?: number | null;
          student?: { firstName?: string; lastName?: string };
          catalogSchool?: { name?: string };
          tenor?: number;
        };
        setApplicationData({
          id: d.id,
          referenceNumber: d.referenceNumber,
          amountRequested: Number(d.amountRequested ?? 0),
          serviceChargeAmount:
            d.serviceChargeAmount != null
              ? Number(d.serviceChargeAmount)
              : null,
          serviceChargeRate:
            d.serviceChargeRate != null ? Number(d.serviceChargeRate) : null,
          student: d.student,
          catalogSchool: d.catalogSchool,
          tenor: d.tenor,
        });
      })
      .catch(() => {
        /* fall through to localStorage fallback */
      })
      .finally(() => setLoadingApp(false));
  }, [effectiveApplicationId]);

  // Resolve amounts: backend takes priority over localStorage
  const tuitionAmount =
    applicationData?.amountRequested ?? Number(storedDetails.amount ?? 0);
  const serviceCharge =
    applicationData?.serviceChargeAmount != null
      ? applicationData.serviceChargeAmount
      : applicationData?.serviceChargeRate != null
        ? Math.round(tuitionAmount * applicationData.serviceChargeRate)
        : Math.round(tuitionAmount * 0.235); // default 23.5% if nothing available

  const studentName = applicationData?.student
    ? `${applicationData.student.firstName ?? ""} ${applicationData.student.lastName ?? ""}`.trim()
    : (storedDetails.studentName ?? "N/A");
  const schoolName =
    applicationData?.catalogSchool?.name ?? storedDetails.schoolName ?? "N/A";
  const repaymentPlan = applicationData?.tenor
    ? `${applicationData.tenor}-month plan`
    : "N/A";
  const applicationId = applicationData?.id ?? effectiveApplicationId;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setIsProcessing(true);
    try {
      const callbackBase = `${window.location.origin}/parent/payment`;
      const callbackUrl = applicationId
        ? `${callbackBase}?applicationId=${applicationId}`
        : callbackBase;

      const result = await paymentService.initiatePayment({
        amount: serviceCharge,
        callbackUrl,
        metadata: {
          type: "service_charge",
          studentName,
          schoolName,
          applicationId: applicationId ?? undefined,
          tuition: tuitionAmount,
        },
      });
      if (result?.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        // No redirect URL — treat as immediate success (sandbox / mock)
        if (applicationId) {
          await parentService.confirmServiceCharge(applicationId);
        }
        navigate(
          applicationId
            ? `/parent/repayment?applicationId=${applicationId}`
            : "/parent/payment",
        );
      }
    } catch (err) {
      setPayError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Payment initialisation failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Lock badge for centre slot ── */
  const lockBadge = (
    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm bg-slate-100 px-3 py-1.5 rounded-full">
      <Icon name="lock" className="w-4 h-4 text-emerald-500" /> Secure Checkout
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AppFlowHeader
        center={lockBadge}
        right={
          <button className="text-sm font-bold text-slate-500 hover:text-brand transition-colors hidden md:block">
            Cancel Payment
          </button>
        }
      />

      {loadingApp && (
        <div className="flex h-40 items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loadingApp && (
        <>
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-0 right-[10%] w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-[100px]" />
          </div>

          <main className="flex-1 py-10 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                  Complete Your Application
                </h1>
                <p className="text-slate-500 font-medium">
                  Pay the one-off service charge to authorise immediate tuition
                  disbursement.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Summary */}
                <div className="lg:col-span-5 order-2 lg:order-1">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                      <h2 className="text-lg font-bold text-slate-900">
                        Payment Summary
                      </h2>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        {[
                          { label: "Target School", value: schoolName },
                          { label: "Student", value: studentName },
                          {
                            label: "Approved Tuition",
                            value: `₦${tuitionAmount.toLocaleString()}`,
                          },
                          { label: "Repayment Plan", value: repaymentPlan },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-slate-500 font-medium">
                              {item.label}
                            </span>
                            <span className="text-sm font-bold text-slate-900 text-right">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full border-t border-dashed border-slate-200" />
                      <div className="bg-brand-50 rounded-2xl p-5 border border-brand/10">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-brand">
                            Service Charge
                            {applicationData?.serviceChargeRate
                              ? ` (${(applicationData.serviceChargeRate * 100).toFixed(1)}%)`
                              : ""}
                          </span>
                          <span className="text-xl font-black text-brand">
                            ₦{serviceCharge.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-brand/70 font-medium">
                          One-off processing fee. No hidden interest.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-6 pt-4 opacity-60 grayscale">
                        <img
                          src="partners/paystack.png"
                          className="h-6 object-contain"
                          alt="Paystack"
                        />
                        <img
                          src="partners/flutter.png"
                          className="h-5 object-contain"
                          alt="Flutterwave"
                        />
                      </div>
                      <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                        <Icon
                          name="shield-check"
                          className="w-4 h-4 text-emerald-500"
                        />{" "}
                        PCI-DSS Compliant & Secured
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment form */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">
                      Select Payment Method
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      {[
                        {
                          value: "card",
                          label: "Debit Card",
                          icon: "credit-card",
                          checked: true,
                        },
                        {
                          value: "transfer",
                          label: "Bank Transfer",
                          icon: "building-2",
                          checked: false,
                        },
                      ].map((m) => (
                        <label key={m.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="payment_method"
                            value={m.value}
                            defaultChecked={m.checked}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <div className="border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-brand/40 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                              <Icon name={m.icon} className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {m.label}
                            </h4>
                          </div>
                        </label>
                      ))}
                    </div>

                    <form onSubmit={handlePayment} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          placeholder="JOHN DOE"
                          required
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          required
                          className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 font-bold placeholder-slate-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 font-bold placeholder-slate-300 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            CVV
                          </label>
                          <input
                            type="password"
                            placeholder="123"
                            maxLength={3}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all text-sm text-slate-800 font-bold placeholder-slate-300 text-center"
                          />
                        </div>
                      </div>
                      {payError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                          {payError}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full mt-6 bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
                      >
                        <span>
                          {isProcessing
                            ? "Redirecting to payment…"
                            : `Pay ₦${serviceCharge.toLocaleString()} Securely`}
                        </span>
                        <Icon name="lock" className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default ServiceChargePage;
