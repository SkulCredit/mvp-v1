import React, { useState, useEffect, useMemo } from "react";
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
  applicationId: string | undefined,
  amount: number,
): TransferDetails {
  const seed = applicationId
    ? applicationId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    : Math.floor(amount);
  const accountNumber = String(1000000000 + (seed % 899999999)).slice(0, 10);
  return {
    bankName: MOCK_BANKS[seed % MOCK_BANKS.length],
    accountNumber,
    accountName: "SkulCredit Technologies Ltd",
    reference: applicationId ? `SC-${applicationId}` : `SC-${Date.now()}`,
    expiresInMinutes: 30,
  };
}

const ServiceChargePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [loadingApp, setLoadingApp] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

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
      .catch(() => {})
      .finally(() => setLoadingApp(false));
  }, [effectiveApplicationId]);

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

  const transferDetails = useMemo(
    () => getMockTransferDetails(applicationId, serviceCharge),
    [applicationId, serviceCharge],
  );

  useEffect(() => {
    if (paymentMethod !== "transfer") return;
    setSecondsLeft(transferDetails.expiresInMinutes * 60);
  }, [paymentMethod, transferDetails]);

  useEffect(() => {
    if (paymentMethod !== "transfer" || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [paymentMethod, secondsLeft]);

  const isExpired = paymentMethod === "transfer" && secondsLeft <= 0;

  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };

  const handleRegenerateTransfer = () => {
    setSecondsLeft(transferDetails.expiresInMinutes * 60);
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

  const handleTransferConfirm = async () => {
    setPayError("");
    setIsProcessing(true);
    try {
      if (applicationId) {
        await parentService.confirmServiceCharge(applicationId);
      }
      navigate(
        applicationId
          ? `/parent/repayment?applicationId=${applicationId}`
          : "/parent/payment",
      );
    } catch (err) {
      setPayError(
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
          "Could not confirm your transfer. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
  
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

                <div className="lg:col-span-7 order-1 lg:order-2">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">
                      Select Payment Method
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      {[
                        {
                          value: "card" as PaymentMethod,
                          label: "Debit Card",
                          icon: "credit-card",
                        },
                        {
                          value: "transfer" as PaymentMethod,
                          label: "Bank Transfer",
                          icon: "building-2",
                        },
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
                              : `Pay ₦${serviceCharge.toLocaleString()} Securely`}
                          </span>
                          <Icon name="lock" className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    {paymentMethod === "transfer" && (
                      <div className="space-y-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Transfer exactly ₦{serviceCharge.toLocaleString()}{" "}
                            to the account below
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
                            {
                              field: "bankName",
                              label: "Bank Name",
                              value: transferDetails.bankName,
                            },
                            {
                              field: "accountNumber",
                              label: "Account Number",
                              value: transferDetails.accountNumber,
                            },
                            {
                              field: "accountName",
                              label: "Account Name",
                              value: transferDetails.accountName,
                            },
                            {
                              field: "reference",
                              label: "Reference",
                              value: transferDetails.reference,
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
                            onClick={handleRegenerateTransfer}
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
        </>
      )}
    </div>
  );
};

export default ServiceChargePage;
