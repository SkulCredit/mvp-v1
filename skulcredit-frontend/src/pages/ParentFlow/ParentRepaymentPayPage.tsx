import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { AppFlowHeader } from "../../components/layout";
import { paymentService, AletpayInitResult } from "../../services/paymentService";
import { parentService } from "../../services/parentService";
import { AxiosError } from "axios";

const ParentRepaymentPayPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const applicationId = searchParams.get("applicationId") ?? "";
  const scheduleIds = searchParams.get("scheduleIds") ?? "";
  const type = (searchParams.get("type") ?? "scheduled") as
    | "scheduled"
    | "early_partial"
    | "early_full";
  const amount = Number(searchParams.get("amount") ?? "0");

  // Shared state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Virtual account (transfer)
  const [virtualAccountDetails, setVirtualAccountDetails] =
    useState<AletpayInitResult | null>(null);
  const [isLoadingVA, setIsLoadingVA] = useState(false);
  const [vaError, setVaError] = useState("");
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [transferMsg, setTransferMsg] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const hasGeneratedRef = useRef(false);

  // Ref that always holds the latest transactionId so the auto-poll interval
  // never closes over a stale virtualAccountDetails value.
  const currentTransactionIdRef = useRef<string | null>(null);

  // Keep the ref in sync whenever virtualAccountDetails changes
  useEffect(() => {
    currentTransactionIdRef.current = virtualAccountDetails?.transactionId ?? null;
  }, [virtualAccountDetails]);

  // ── Virtual account generation ────────────────────────────────────────────

  useEffect(() => {
    if (
      hasGeneratedRef.current ||
      !applicationId ||
      amount <= 0
    )
      return;
    hasGeneratedRef.current = true;
    void generateVirtualAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, amount]);

  async function generateVirtualAccount() {
    setIsLoadingVA(true);
    setVaError("");
    setTransferMsg("");
    try {
      const orderId = `REP-${String(applicationId).slice(0, 8)}-${Date.now()}`;
      const result = await paymentService.initiatePayment({
        amount,
        orderId,
        description: "Repayment installment",
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

  // Uses currentTransactionIdRef so it is safe to call from the interval
  // without closing over a potentially stale virtualAccountDetails state.
  async function verifyAndConfirm(): Promise<boolean> {
    const txId = currentTransactionIdRef.current;
    if (!txId) return false;
    try {
      const data = await paymentService.verifyPayment(txId);
      const status = String(data.status ?? "").toLowerCase();
      if (status === "successful") {
        await (
          parentService.confirmInstallmentPayment as (
            appId: string,
            p: {
              transactionReference?: string;
              paystackReference?: string;
              scheduleIds: string[];
              type: "scheduled" | "early_partial" | "early_full";
            },
          ) => Promise<unknown>
        )(applicationId, {
          transactionReference: txId,
          scheduleIds: scheduleIds.split(","),
          type,
        });
        navigate("/parent/repayment");
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

  // Auto-poll every 30 s. The interval callback reads currentTransactionIdRef
  // directly so it is never stale — even across handleRegenerateAccount.
  useEffect(() => {
    if (!virtualAccountDetails || isExpired) return;
    const interval = setInterval(async () => {
      setIsPolling(true);
      await verifyAndConfirm();
      setIsPolling(false);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualAccountDetails, isExpired]);

  const handleRegenerateAccount = () => {
    hasGeneratedRef.current = false;
    setVirtualAccountDetails(null);
    setSecondsLeft(0);
    void generateVirtualAccount();
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmtAmt = (n: number) =>
    "₦" +
    n.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const scheduleCount = scheduleIds
    ? scheduleIds.split(",").filter(Boolean).length
    : 0;
  const planLabel =
    type === "early_full"
      ? "Full Liquidation"
      : type === "early_partial"
        ? `${scheduleCount} Instalment${scheduleCount > 1 ? "s" : ""}`
        : "Monthly Instalment";

  if (!applicationId || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 px-8 py-10 text-center max-w-sm w-full">
          <p className="text-sm font-bold text-red-600 mb-4">
            Invalid payment request.
          </p>
          <button
            type="button"
            onClick={() => navigate("/parent/repayment")}
            className="text-sm font-semibold text-brand hover:text-brand-hover"
          >
            Back to Repayment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AppFlowHeader
        center={
          <div className="flex items-center gap-2 text-brand text-sm font-bold bg-brand/5 px-3 py-1.5 rounded-full border border-brand/10">
            <Icon name="shield-check" className="w-4 h-4" />
            <span>Secure Repayment</span>
          </div>
        }
        right={
          <button
            type="button"
            onClick={() => navigate("/parent/repayment")}
            className="text-sm font-bold text-slate-500 hover:text-brand transition-colors hidden md:block"
          >
            Back to Repayment
          </button>
        }
      />

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 py-10 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              Process Repayment
            </h1>
            <p className="text-slate-500 font-medium">
              Transfer the exact amount to the account below to complete your
              repayment.
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
                <div className="p-6 space-y-5">
                  <div className="space-y-3">
                    {[
                      {
                        label: "Application",
                        value: applicationId.slice(0, 12).toUpperCase() + "…",
                      },
                      { label: "Payment Type", value: planLabel },
                      {
                        label: "Instalments",
                        value:
                          scheduleCount > 1
                            ? `${scheduleCount} selected`
                            : "1 instalment",
                      },
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
                  <div className="bg-brand/5 rounded-2xl p-5 border border-brand/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-brand">
                        Total to Pay
                      </span>
                      <span className="text-xl font-black text-brand">
                        {fmtAmt(amount)}
                      </span>
                    </div>
                    <p className="text-xs text-brand/70 font-medium">
                      No interest. No hidden charges.
                    </p>
                  </div>
                  <div className="flex items-center justify-center pt-2 opacity-70">
                    <p className="text-sm font-semibold text-slate-500">
                      Powered by Aletpay / Wema Bank
                    </p>
                  </div>
                  <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                    <Icon
                      name="shield-check"
                      className="w-4 h-4 text-emerald-500"
                    />
                    PCI-DSS Compliant &amp; Secured
                  </p>
                </div>
              </div>

              {/* Coming soon: Debit Card */}
              <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 opacity-60">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="credit-card" className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    Debit Card — Coming Soon
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Card payments will be available in a future update.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: Bank Transfer ── */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name="building-2" className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Bank Transfer
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Transfer from any bank in Nigeria
                    </p>
                  </div>
                </div>

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

                  {/* VA error (before any details appear) */}
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
                          Transfer exactly {fmtAmt(amount)} to the account
                          below
                        </p>

                        {/* Countdown */}
                        <div className="flex flex-col items-center gap-1 py-2">
                          <span className="text-xs font-semibold text-slate-400">
                            {isExpired
                              ? "Account expired"
                              : "Account valid for:"}
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
                          {
                            field: "bankName",
                            label: "Bank Name",
                            value: virtualAccountDetails.bankName,
                          },
                          {
                            field: "accountNumber",
                            label: "Account Number",
                            value: virtualAccountDetails.virtualBankAccountNumber,
                          },
                          {
                            field: "accountName",
                            label: "Account Name",
                            value: "SkulCredit Technologies Ltd",
                          },
                          {
                            field: "amount",
                            label: "Amount",
                            value: fmtAmt(amount),
                          },
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
                          This account is unique to this transaction and valid
                          for 24 hours. Do not reuse it for other payments.
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentRepaymentPayPage;
