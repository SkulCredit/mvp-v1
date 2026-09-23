import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { AppFlowHeader } from "../../components/layout";
import { paymentService } from "../../services/paymentService";
import { parentService } from "../../services/parentService";
import { AxiosError } from "axios";

type PaymentMethod = "card" | "transfer";

interface TransferDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  expiresInMinutes: number;
}

const MOCK_BANKS = ["Wema Bank", "Providus Bank", "Sterling Bank"];

function getMockTransferDetails(
  applicationId: string,
  amount: number,
): TransferDetails {
  const seed = applicationId
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const accountNumber = String(1000000000 + (seed % 899999999)).slice(0, 10);
  return {
    bankName: MOCK_BANKS[seed % MOCK_BANKS.length],
    accountNumber,
    accountName: "SkulCredit Technologies Ltd",
    reference: `REP-${applicationId.slice(0, 8).toUpperCase()}`,
    expiresInMinutes: 30,
  };
}

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const transferDetails = useMemo(
    () => getMockTransferDetails(applicationId, amount),
    [applicationId, amount],
  );

  useEffect(() => {
    setSecondsLeft(transferDetails.expiresInMinutes * 60);
  }, [transferDetails.expiresInMinutes]);

  useEffect(() => {
    if (paymentMethod !== "transfer") return;
    if (secondsLeft <= 0) return;
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [paymentMethod, secondsLeft]);

  const isExpired = secondsLeft === 0;

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

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setIsProcessing(true);
    try {
      const callbackUrl = `${window.location.origin}/parent/repayment-callback?applicationId=${applicationId}&scheduleIds=${scheduleIds}&type=${type}`;
      const result = await paymentService.initiatePayment({
        amount,
        callbackUrl,
        metadata: {
          type: "repayment",
          applicationId,
          scheduleIds: scheduleIds.split(","),
          repaymentType: type,
        },
      });
      const r = result as { authorization_url?: string };
      if (r.authorization_url) {
        window.location.href = r.authorization_url;
      } else {
        await (
          parentService.confirmInstallmentPayment as (
            appId: string,
            payload: {
              paystackReference: string;
              scheduleIds: string[];
              type: "scheduled" | "early_partial" | "early_full";
            },
          ) => Promise<unknown>
        )(applicationId, {
          paystackReference: `MOCK-${Date.now()}`,
          scheduleIds: scheduleIds.split(","),
          type,
        });
        navigate(`/parent/repayment`);
      }
    } catch (err) {
      setPayError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Payment initiation failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferConfirm = async () => {
    setPayError("");
    setIsProcessing(true);
    try {
      await (
        parentService.confirmInstallmentPayment as (
          appId: string,
          payload: {
            paystackReference: string;
            scheduleIds: string[];
            type: "scheduled" | "early_partial" | "early_full";
          },
        ) => Promise<unknown>
      )(applicationId, {
        paystackReference: transferDetails.reference,
        scheduleIds: scheduleIds.split(","),
        type,
      });
      navigate(`/parent/repayment`);
    } catch (err) {
      setPayError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Could not confirm your transfer. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

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
              Choose how you want to make this payment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                      { label: "Application", value: applicationId.slice(0, 12).toUpperCase() + "…" },
                      { label: "Payment Type", value: planLabel },
                      { label: "Instalments", value: scheduleCount > 1 ? `${scheduleCount} selected` : "1 instalment" },
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
                  <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                    <Icon name="shield-check" className="w-4 h-4 text-emerald-500" />
                    PCI-DSS Compliant & Secured
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  Select Payment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { value: "card" as PaymentMethod, label: "Debit Card", icon: "credit-card" },
                    { value: "transfer" as PaymentMethod, label: "Bank Transfer", icon: "building-2" },
                  ].map((m) => (
                    <label key={m.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="payment_method"
                        value={m.value}
                        checked={paymentMethod === m.value}
                        onChange={() => {
                          setPayError("");
                          setPaymentMethod(m.value);
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                          paymentMethod === m.value
                            ? "border-brand ring-2 ring-brand/10"
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
                          : `Pay ${fmtAmt(amount)} Securely`}
                      </span>
                      <Icon name="lock" className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {paymentMethod === "transfer" && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Transfer exactly {fmtAmt(amount)} to the account below
                      </p>

                      <div className="flex flex-col items-center gap-1 py-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {isExpired
                            ? "Details expired"
                            : "Make a single instant transfer before it expires:"}
                        </span>
                        <span
                          className={`text-2xl font-black tabular-nums tracking-wider ${
                            isExpired
                              ? "text-red-500"
                              : secondsLeft <= 60
                                ? "text-red-500"
                                : "text-emerald-500"
                          }`}
                        >
                          {formatCountdown(secondsLeft)}
                        </span>
                      </div>

                      {[
                        { field: "bankName", label: "Bank Name", value: transferDetails.bankName },
                        { field: "accountNumber", label: "Account Number", value: transferDetails.accountNumber },
                        { field: "accountName", label: "Account Name", value: transferDetails.accountName },
                        { field: "reference", label: "Reference", value: transferDetails.reference },
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
                            className="text-xs font-bold text-brand hover:text-brand-hover px-3 py-1.5 rounded-lg bg-brand/5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {copiedField === row.field ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-slate-400 font-medium">
                        Do not save or reuse this account number. Use the
                        reference above so we can match your payment
                        automatically.
                      </p>
                    </div>

                    {payError && (
                      <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                        {payError}
                      </div>
                    )}

                    {isExpired ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSecondsLeft(transferDetails.expiresInMinutes * 60)
                        }
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        Generate New Transfer Details
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTransferConfirm}
                        disabled={isProcessing}
                        className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <span>
                          {isProcessing
                            ? "Confirming…"
                            : "I've Made This Transfer"}
                        </span>
                        <Icon name="lock" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentRepaymentPayPage;
