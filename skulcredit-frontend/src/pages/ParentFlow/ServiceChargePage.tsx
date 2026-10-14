import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { AppFlowHeader } from "../../components/layout";
import { paymentService, AletpayInitResult } from "../../services/paymentService";
import { parentService } from "../../services/parentService";
import { AxiosError } from "axios";

interface StudentDetails {
  studentName?: string;
  schoolName?: string;
  schoolId?: string;
  amount?: number | string;
  applicationId?: string;
}

type PaymentMethod = "card" | "transfer";

const ServiceChargePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // App loading
  const [loadingApp, setLoadingApp] = useState(false);
  const [loadAppError, setLoadAppError] = useState("");

  // Card payment
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [cardError, setCardError] = useState("");

  // Virtual account (transfer tab)
  const [virtualAccountDetails, setVirtualAccountDetails] =
    useState<AletpayInitResult | null>(null);
  const [isLoadingVA, setIsLoadingVA] = useState(false);
  const [vaError, setVaError] = useState("");
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [transferMsg, setTransferMsg] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

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

  // Load application details
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
            d.serviceChargeAmount != null ? Number(d.serviceChargeAmount) : null,
          serviceChargeRate:
            d.serviceChargeRate != null ? Number(d.serviceChargeRate) : null,
          student: d.student,
          catalogSchool: d.catalogSchool,
          tenor: d.tenor,
        });
      })
      .catch(() => {
        setLoadAppError(
          "Failed to load application details. Please refresh the page.",
        );
      })
      .finally(() => setLoadingApp(false));
  }, [effectiveApplicationId]);

  // Derived values
  const tuitionAmount =
    applicationData?.amountRequested ?? Number(storedDetails.amount ?? 0);
  const serviceCharge =
    applicationData?.serviceChargeAmount != null
      ? applicationData.serviceChargeAmount
      : applicationData?.serviceChargeRate != null
        ? Math.round(tuitionAmount * applicationData.serviceChargeRate)
        : Math.round(tuitionAmount * 0.235);

  const studentName = applicationData?.student
    ? `${applicationData.student.firstName ?? ""} ${applicationData.student.lastName ?? ""}`.trim()
    : (storedDetails.studentName ?? "N/A");
  const schoolName =
    applicationData?.catalogSchool?.name ?? storedDetails.schoolName ?? "N/A";
  const repaymentPlan = applicationData?.tenor
    ? `${applicationData.tenor}-month plan`
    : "N/A";
  const applicationId = applicationData?.id ?? effectiveApplicationId;

  // ── Virtual account generation (transfer tab) ──────────────────────────────
  const hasGeneratedRef = useRef(false);

  // Auto-generate when user switches to transfer tab for the first time
  useEffect(() => {
    if (
      paymentMethod !== "transfer" ||
      hasGeneratedRef.current ||
      !applicationId ||
      serviceCharge <= 0
    )
      return;
    hasGeneratedRef.current = true;
    void generateVirtualAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, applicationId, serviceCharge]);

  async function generateVirtualAccount() {
    setIsLoadingVA(true);
    setVaError("");
    setTransferMsg("");
    try {
      const orderId = `SC-${String(applicationId ?? "").slice(0, 8)}-${Date.now()}`;
      const result = await paymentService.initiatePayment({
        amount: serviceCharge,
        orderId,
        description: "Service charge payment",
      });
      setVirtualAccountDetails(result);
      const secs = Math.max(
        0,
        Math.floor((new Date(result.expiredAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(secs);
    } catch (err) {
      setVaError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Could not generate payment account. Please try again.",
      );
    } finally {
      setIsLoadingVA(false);
    }
  }

  // Countdown tick
  useEffect(() => {
    if (!virtualAccountDetails || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [virtualAccountDetails, secondsLeft]);

  const isExpired = !!virtualAccountDetails && secondsLeft <= 0;

  const formatCountdown = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      setCopiedField(null);
    }
  };

  async function verifyAndConfirm(): Promise<boolean> {
    if (!virtualAccountDetails) return false;
    try {
      const data = await paymentService.verifyPayment(
        virtualAccountDetails.transactionId,
      );
      const status = String(data.status ?? "").toLowerCase();
      if (status === "successful") {
        if (applicationId) {
          await parentService.confirmServiceCharge(
            applicationId,
            virtualAccountDetails.transactionId,
          );
        }
        navigate(
          applicationId
            ? `/parent/repayment?applicationId=${applicationId}`
            : "/parent/repayment",
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const handleCheckTransfer = async () => {
    setIsProcessingTransfer(true);
    setTransferMsg("");
    const confirmed = await verifyAndConfirm();
    if (!confirmed) {
      setTransferMsg(
        "Transfer not yet received. Please wait a few minutes and try again.",
      );
    }
    setIsProcessingTransfer(false);
  };

  // Auto-poll every 30s while transfer tab is active
  useEffect(() => {
    if (paymentMethod !== "transfer" || !virtualAccountDetails || isExpired)
      return;
    const interval = setInterval(async () => {
      setIsPolling(true);
      await verifyAndConfirm();
      setIsPolling(false);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, virtualAccountDetails, isExpired]);

  const handleRegenerateAccount = () => {
    hasGeneratedRef.current = false;
    setVirtualAccountDetails(null);
    setSecondsLeft(0);
    void generateVirtualAccount();
  };

  // ── Card "payment" ──────────────────────────────────────────────────────────
  // Card details are collected locally; actual charge goes through Aletpay
  // bank transfer on the backend. For now this simulates submission and
  // immediately confirms the service charge (Aletpay does not support raw
  // card charging via the bank-transfer API).
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError("");
    setIsProcessingCard(true);
    try {
      if (applicationId) {
        await parentService.confirmServiceCharge(applicationId);
      }
      navigate(
        applicationId
          ? `/parent/repayment?applicationId=${applicationId}`
          : "/parent/repayment",
      );
    } catch (err) {
      setCardError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Payment failed. Please try again.",
      );
    } finally {
      setIsProcessingCard(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AppFlowHeader />

      {loadingApp && (
        <div className="flex h-40 items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loadingApp && loadAppError && (
        <div className="flex h-40 items-center justify-center px-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-red-700">{loadAppError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-brand hover:underline"
            >
              Reload page
            </button>
          </div>
        </div>
      )}

      {!loadingApp && !loadAppError && (
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
                {/* ── Left: Payment Summary ── */}
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
                      <div className="flex items-center justify-center pt-2 opacity-70">
                        <p className="text-sm font-semibold text-slate-500">
                          Powered by Aletpay / Wema Bank
                        </p>
                      </div>
                      <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                        <Icon name="shield-check" className="w-4 h-4 text-emerald-500" />
                        PCI-DSS Compliant &amp; Secured
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Right: Payment ── */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">
                      Select Payment Method
                    </h2>

                    {/* Method selector */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {(
                        [
                          { value: "card" as PaymentMethod, label: "Debit Card", icon: "credit-card" },
                          { value: "transfer" as PaymentMethod, label: "Bank Transfer", icon: "building-2" },
                        ] as { value: PaymentMethod; label: string; icon: string }[]
                      ).map((m) => (
                        <label key={m.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="payment_method"
                            value={m.value}
                            checked={paymentMethod === m.value}
                            onChange={() => {
                              setCardError("");
                              setTransferMsg("");
                              setPaymentMethod(m.value);
                            }}
                            className="sr-only"
                          />
                          <div
                            className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                              paymentMethod === m.value
                                ? "border-brand ring-2 ring-brand/10 bg-brand-50/30"
                                : "border-slate-200 hover:border-brand/40"
                            }`}
                          >
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

                    {/* ── DEBIT CARD ── */}
                    {paymentMethod === "card" && (
                      <form onSubmit={handleCardPayment} className="space-y-5">
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
                        {cardError && (
                          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                            {cardError}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isProcessingCard}
                          className="w-full mt-6 bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                          <span>
                            {isProcessingCard
                              ? "Processing…"
                              : `Pay ₦${serviceCharge.toLocaleString()} Securely`}
                          </span>
                          <Icon name="lock" className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    {/* ── BANK TRANSFER ── */}
                    {paymentMethod === "transfer" && (
                      <div className="space-y-5">
                        {/* Loading VA */}
                        {isLoadingVA && (
                          <div className="flex flex-col items-center justify-center py-14 gap-4">
                            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-slate-500 font-medium">
                              Generating your payment account…
                            </p>
                          </div>
                        )}

                        {/* VA error */}
                        {!isLoadingVA && vaError && !virtualAccountDetails && (
                          <div className="space-y-4">
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                              {vaError}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                hasGeneratedRef.current = false;
                                void generateVirtualAccount();
                              }}
                              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
                            >
                              Try Again
                            </button>
                          </div>
                        )}

                        {/* Virtual account details */}
                        {!isLoadingVA && virtualAccountDetails && (
                          <>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Transfer exactly ₦{serviceCharge.toLocaleString()} to the account below
                              </p>

                              {/* Countdown */}
                              <div className="flex flex-col items-center gap-1 py-2">
                                <span className="text-xs font-semibold text-slate-400">
                                  {isExpired ? "Account expired" : "Account valid for:"}
                                </span>
                                <span
                                  className={`text-2xl font-black tabular-nums tracking-wider ${
                                    isExpired
                                      ? "text-red-500"
                                      : secondsLeft <= 300
                                        ? "text-red-500"
                                        : "text-emerald-500"
                                  }`}
                                >
                                  {formatCountdown(secondsLeft)}
                                </span>
                              </div>

                              {/* Account rows */}
                              {[
                                { field: "bankName", label: "Bank Name", value: virtualAccountDetails.bankName },
                                { field: "accountNumber", label: "Account Number", value: virtualAccountDetails.virtualBankAccountNumber },
                                { field: "accountName", label: "Account Name", value: "SkulCredit Technologies Ltd" },
                                { field: "amount", label: "Amount", value: `₦${serviceCharge.toLocaleString()}` },
                              ].map((row) => (
                                <div
                                  key={row.field}
                                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100"
                                >
                                  <div>
                                    <p className="text-[11px] text-slate-400 font-semibold uppercase">
                                      {row.label}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                      {row.value}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(row.field, row.value)}
                                    disabled={isExpired}
                                    className="text-xs font-bold text-brand hover:text-brand-hover px-3 py-1.5 rounded-lg bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {copiedField === row.field ? "Copied ✓" : "Copy"}
                                  </button>
                                </div>
                              ))}

                              <p className="text-xs text-slate-400 font-medium">
                                This account is unique to this transaction and valid for 24 hours.
                                Do not reuse it for other payments.
                              </p>
                            </div>

                            {isPolling && (
                              <p className="text-xs text-center text-slate-400 animate-pulse">
                                Checking payment status…
                              </p>
                            )}

                            {transferMsg && (
                              <div className="p-3 bg-amber-50 text-amber-700 text-sm rounded-xl font-medium">
                                {transferMsg}
                              </div>
                            )}

                            {vaError && (
                              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                                {vaError}
                              </div>
                            )}

                            {isExpired ? (
                              <button
                                type="button"
                                onClick={handleRegenerateAccount}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                              >
                                <Icon name="refresh-cw" className="w-4 h-4" />
                                Generate New Account
                              </button>
                            ) : (
                              <div className="space-y-3">
                                <button
                                  type="button"
                                  onClick={handleCheckTransfer}
                                  disabled={isProcessingTransfer}
                                  className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                  <span>
                                    {isProcessingTransfer
                                      ? "Checking payment…"
                                      : "I've Made This Transfer"}
                                  </span>
                                  <Icon name="lock" className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCheckTransfer}
                                  disabled={isProcessingTransfer}
                                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl transition-all border border-slate-200 text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                  <Icon name="refresh-cw" className="w-3.5 h-3.5" />
                                  Refresh Payment Status
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleRegenerateAccount}
                              className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium py-1 transition-colors"
                            >
                              Generate a new account number
                            </button>
                          </>
                        )}
                      </div>
                    )}
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
