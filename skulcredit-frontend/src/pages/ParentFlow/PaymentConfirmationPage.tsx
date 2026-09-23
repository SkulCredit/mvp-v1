import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { AppFlowHeader } from "../../components/layout";
import { paymentService } from "../../services/paymentService";
import { parentService } from "../../services/parentService";

const PaymentConfirmationPage: React.FC = () => {
  const [stage, setStage] = useState<1 | 2>(1);
  const [processing, setProcessing] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paystackRef =
    searchParams.get("reference") ?? searchParams.get("trxref");
  const applicationId = searchParams.get("applicationId");
  useEffect(() => {
    if (!paystackRef) {
      setProcessing(false);
      return;
    }
    (async () => {
      try {
        await paymentService.verifyPayment(paystackRef);
        if (applicationId) {
          await parentService.confirmServiceCharge(applicationId, paystackRef);
        }
      } catch {
      } finally {
        setProcessing(false);
      }
    })();
  }, [paystackRef, applicationId]);

  useEffect(() => {
    if (stage !== 2) return;
    const t = setTimeout(() => setProcessing(false), 2000);
    return () => clearTimeout(t);
  }, [stage]);

  const statusBadge = (
    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
      <Icon name="check-circle" className="w-4 h-4" />
      <span>Payment Confirmed</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AppFlowHeader
        center={statusBadge}
        right={
          <button className="text-sm font-bold text-slate-500 hover:text-brand transition-colors hidden md:block">
            Back to Dashboard
          </button>
        }
      />

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-[20%] w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 py-10 px-4 md:px-8 relative flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div
          className={`w-full max-w-lg mx-auto absolute transition-all duration-500 z-20 ${stage !== 1 ? "opacity-0 pointer-events-none hidden" : ""}`}
        >
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-white -z-0" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <Icon name="check" className="w-10 h-10 stroke-[3]" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                Payment Successful!
              </h1>
              <p className="text-slate-500 font-medium mb-8">
                Your service charge has been processed.
              </p>
              <div className="mb-8">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Amount Paid
                </p>
                <h2 className="text-4xl font-black text-brand">₦142,000</h2>
              </div>
              <div className="space-y-4 text-left mb-8">
                {[
                  { label: "Reference Number", value: "SC-TRX-89421A" },
                  { label: "Date & Time", value: "May 13, 2026, 11:35 AM" },
                  { label: "Payment Method", value: "Debit Card (**** 1234)" },
                  { label: "Student", value: "Johnathan Doe" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-slate-500 font-medium">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStage(2)}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                Track Tuition Disbursement
                <Icon
                  name="arrow-right"
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button className="w-full mt-4 py-3 text-slate-500 font-bold hover:text-brand transition-colors text-sm flex items-center justify-center gap-2">
                <Icon name="download" className="w-4 h-4" /> Download Receipt
              </button>
            </div>
          </div>
        </div>
        <div
          className={`w-full max-w-5xl mx-auto absolute transition-all duration-500 z-10 ${stage !== 2 ? "opacity-0 pointer-events-none hidden" : ""}`}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              Disbursement Status
            </h1>
            <p className="text-slate-500 font-medium">
              We are transferring the approved tuition directly to the school.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-8">
                Transfer Progress
              </h3>
              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100" />
                <div
                  className="absolute left-6 top-6 w-0.5 bg-brand transition-all duration-[2000ms] ease-in-out"
                  style={{ height: "50%" }}
                />
                <div className="space-y-10 relative">
                  {[
                    {
                      icon: "check",
                      title: "Service Fee Paid",
                      desc: "Payment of ₦142,000 received successfully.",
                      done: true,
                    },
                    {
                      icon: "check",
                      title: "Repayment Setup Completed",
                      desc: "Auto-debit mandate setup successful.",
                      done: true,
                    },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-[0_0_0_6px_white]">
                        <Icon name={s.icon} className="w-6 h-6 stroke-[3]" />
                      </div>
                      <div className="pt-2">
                        <h4 className="text-slate-900 font-bold text-lg">
                          {s.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-6">
                    <div
                      className={`w-12 h-12 rounded-full border-2 bg-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-[0_0_0_6px_white] transition-colors duration-500 ${processing ? "border-blue-500 text-blue-500" : "border-emerald-500 text-emerald-500"}`}
                    >
                      {processing ? (
                        <Icon
                          name="loader-2"
                          className="w-5 h-5 animate-spin"
                        />
                      ) : (
                        <Icon name="check" className="w-6 h-6 stroke-[3]" />
                      )}
                    </div>
                    <div className="pt-2">
                      <h4
                        className={`font-bold text-lg transition-colors ${processing ? "text-blue-600" : "text-slate-900"}`}
                      >
                        {processing
                          ? "Processing Loan Disbursement"
                          : "Loan Disbursed"}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Sending ₦710,000 to Foster Prime Schools.
                      </p>
                    </div>
                  </div>

                  {[
                    {
                      icon: "calendar",
                      title: "First Repayment Made",
                      desc: "Upcoming.",
                    },
                    {
                      icon: "check-circle-2",
                      title: "Loan Closed",
                      desc: "Fully paid off.",
                    },
                    {
                      icon: "party-popper",
                      title: "Eligible to Reapply",
                      desc: "",
                    },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6 opacity-40">
                      <div className="w-12 h-12 rounded-full border-2 bg-white border-slate-200 text-slate-400 flex items-center justify-center flex-shrink-0 relative z-10 shadow-[0_0_0_6px_white]">
                        <Icon name={s.icon} className="w-5 h-5" />
                      </div>
                      <div className="pt-2">
                        <h4 className="font-bold text-lg text-slate-700">
                          {s.title}
                        </h4>
                        {s.desc && (
                          <p className="text-sm text-slate-500 mt-1">
                            {s.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`mt-10 pt-8 border-t border-slate-100 transition-opacity duration-500 ${processing ? "opacity-0 hidden" : "opacity-100"}`}
              >
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-emerald-800 font-bold text-lg">
                      Tuition completely sorted! 🎉
                    </h4>
                    <p className="text-sm text-emerald-600/80 font-medium">
                      Next, let's set up how you want to repay us.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        applicationId
                          ? `/parent/repayment?applicationId=${applicationId}`
                          : "/parent/repayment",
                      )
                    }
                    className="w-full md:w-auto bg-brand hover:bg-brand-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md whitespace-nowrap"
                  >
                    Setup Repayment Plan
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Disbursement Details
              </h3>
              <div>
                <p className="text-xs text-slate-500 mb-1">Amount to Send</p>
                <p className="text-3xl font-black text-slate-900">₦710,000</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">
                  Recipient Institution
                </p>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand/50 shadow-sm">
                    <Icon name="building-2" className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm">
                    Foster Prime Schools
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  School Bank Account
                </p>
                <p className="font-bold text-slate-900 font-mono tracking-wider">
                  0123456789
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Guaranty Trust Bank
                </p>
              </div>
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex gap-3 text-sm font-medium">
                <Icon name="info" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Transfer processing generally takes between 5 to 15 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentConfirmationPage;
