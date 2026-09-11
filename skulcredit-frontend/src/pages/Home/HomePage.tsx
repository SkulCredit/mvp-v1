import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { PublicNav, PublicFooter } from "../../components/layout";

type ActiveView = "home" | "schools";
type WaitlistType = "parent" | "school";
type WaitlistStatus = "loading" | "success" | "error" | null;

const FAQ_ITEMS = [
  {
    q: "Who can become a SkulCredit Partner School?",
    a: "Any accredited primary, secondary, or tertiary institution can apply to join our partner network. Your school must be officially registered and approved by the appropriate education board in Nigeria.",
  },
  {
    q: "What information do I need to provide as a parent?",
    a: "You'll need basic identification (BVN/NIN), proof of employment or stable income, the student's details, and the school's official fee invoice or admission letter.",
  },
  {
    q: "How long does the approval process take?",
    a: "Our automated system processes most applications within 15 minutes. Final disbursement to the school's account is guaranteed within 24 to 48 hours of your acceptance of the loan terms.",
  },
  {
    q: "What is the interest rate?",
    a: "There is no interest rate, but a service charge as low as 10% one-off payment depending on the tiering system.",
  },
  {
    q: "What is the tiering system?",
    a: "The tiering system is a ranking placement for schools in order to arrive at the appropriate service charge.",
  },
  {
    q: "What is the Service charge?",
    a: "This is a one-off payment made upon approval before the tuition fee is disbursed to the schools accordingly.",
  },
  {
    q: "Can I pay off my loan early?",
    a: "Yes! You can liquidate or pay off your outstanding balance at any time before the end of your tenure. We do not charge any early repayment penalties.",
  },
];

const REASONS = [
  {
    num: "01",
    color: "indigo",
    title: "Flexible installments",
    desc: "Avoid paying full school fees at once. Split large term payments into manageable installments.",
  },
  {
    num: "02",
    color: "emerald",
    title: "Uninterrupted education",
    desc: "Keep your child's education uninterrupted with on-time fee payments every school term.",
  },
  {
    num: "03",
    color: "rose",
    title: "Full upfront payment",
    desc: "Schools receive 100% payment upfront, giving parents immediate peace of mind.",
  },
  {
    num: "04",
    color: "amber",
    title: "Cash-flow friendly",
    desc: "Repayment plans are structured around real household cash flow, not rigid deadlines.",
  },
  {
    num: "05",
    color: "cyan",
    title: "Fast digital application",
    desc: "Apply quickly online with a simple digital process designed to save parents time.",
  },
  {
    num: "06",
    color: "violet",
    title: "Less pressure",
    desc: "Reduce the financial pressure that usually comes with every new school term.",
  },
  {
    num: "07",
    color: "teal",
    title: "Built for Nigerian parents",
    desc: "Built specifically for Nigerian families and the realities of school fee payment cycles.",
  },
  {
    num: "08",
    color: "orange",
    title: "Trusted payment systems",
    desc: "Powered by secure payment infrastructure including Paystack, Remita, and Flutterwave.",
  },
  {
    num: "09",
    color: "pink",
    title: "Recurring support",
    desc: "A smarter way to manage recurring school expenses term after term.",
  },
  {
    num: "10",
    color: "slate",
    title: "More breathing room",
    desc: "Gain breathing room for your household while keeping your child's education on track.",
  },
];

const SCHOOL_ELIGIBILITY = [
  "Your school is a registered and accredited educational institution recognized by relevant authorities.",
  "You can provide valid business registration documents (CAC certificate, tax identification, etc.).",
  "You are willing to submit school and management details for verification and background checks.",
  "You have a designated finance or admin representative to manage loan requests and approvals.",
  "You agree to verify student tuition details and payment records accurately when requested.",
  "You consent to Skulcredit's due diligence process, including background and compliance verification.",
  "You will maintain an active dashboard account to track, approve, or confirm parent/student loan applications.",
];

const HomePage: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [waitlistType, setWaitlistType] = useState<WaitlistType>("parent");
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>(null);

  /* Intersection-observer for scroll-reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("active");
        }),
      { threshold: 0.1 },
    );
    const els = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale",
    );
    els.forEach((el) => observer.observe(el));
    return () => els.forEach((el) => observer.unobserve(el));
  }, [activeView]);

  const scrollToSection = (id: string) => {
    setActiveView("home");
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWaitlistStatus("loading");
    const form = e.currentTarget;
    try {
      const res = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setWaitlistStatus("success");
        form.reset();
      } else setWaitlistStatus("error");
    } catch {
      setWaitlistStatus("error");
    }
  };

  return (
    <>
      {/* ── Shared marketing nav ───────────────────────────── */}
      <PublicNav
        activeView={activeView}
        onSetView={setActiveView}
        onScrollTo={scrollToSection}
      />

      <main className="pb-0">
        {/* ════════════════════════ HOME VIEW ════════════════════════ */}
        <div className={activeView === "home" ? "block" : "hidden"}>
          {/* Hero */}
          <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.6] pointer-events-none" />
            <div className="absolute top-20 left-10 w-96 h-96 bg-rose-200/40 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-100/50 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

            <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
              <div className="text-center max-w-4xl mx-auto mb-12 space-y-6">
                <h1
                  className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 tracking-tight leading-[1.05] animate-fade-in-up opacity-0"
                  style={{ animationDelay: "0.1s" }}
                >
                  Education First, <br />
                  <span className="text-[#881337]">Payment Made Easy.</span>
                </h1>
                <p
                  className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto animate-fade-in-up opacity-0"
                  style={{ animationDelay: "0.3s" }}
                >
                  SkulCredit helps parents cover school fees instantly. We pay
                  your school directly while you repay in simple, flexible
                  installments without the usual financial stress.
                </p>
              </div>

              {/* Calculator card */}
              <div
                className="max-w-4xl mx-auto animate-fade-in-up opacity-0 relative"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-[3rem] p-4 border border-white shadow-calculator">
                  <div className="bg-white rounded-[2.5rem] p-8 md:p-14 border border-slate-100 relative overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                      <div className="space-y-12">
                        <div>
                          <div className="flex justify-between items-end mb-6">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              I want to borrow
                            </label>
                            <div className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                              ₦ 710,000
                            </div>
                          </div>
                          <div className="py-2">
                            <input
                              type="range"
                              min="50000"
                              max="1000000"
                              step="10000"
                              defaultValue="710000"
                              className="range-slider relative z-20 w-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 font-bold mt-3">
                            <span>₦50k</span>
                            <span>₦1M+</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">
                            Repayment Period
                          </label>
                          <div className="flex gap-4">
                            <button className="flex-1 py-4 rounded-2xl border border-rose-600 bg-rose-50 text-rose-900 font-bold text-sm">
                              3 Months
                            </button>
                            <button className="flex-1 py-4 rounded-2xl border border-slate-200 bg-white text-slate-500 font-bold text-sm hover:border-slate-300 transition-all">
                              4 Months
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between h-full space-y-8 lg:pl-10 lg:border-l lg:border-slate-100">
                        <div className="space-y-2 text-center lg:text-left mt-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Monthly Repayment
                          </p>
                          <h3 className="text-6xl font-black text-rose-900 tracking-tighter leading-none">
                            ₦ 236,667
                          </h3>
                          <div className="pt-3">
                            <div className="inline-block text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 animate-pulse-slow">
                              Service Charge: ₦ 142,000 (One-off payment)
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4 w-full">
                          <Link
                            to="/auth"
                            className="w-full py-5 bg-rose-900 text-white rounded-2xl font-bold text-lg hover:bg-rose-800 shadow-xl shadow-rose-900/20 transition-colors flex items-center justify-center gap-2 group"
                          >
                            Get this Plan{" "}
                            <Icon
                              name="arrow-right"
                              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            />
                          </Link>
                          <p className="text-center text-xs text-slate-400 font-medium">
                            No hidden fees. Instant approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partners strip */}
              <div className="mt-32 pt-10 border-t border-slate-200/50 reveal delay-500 max-w-4xl mx-auto">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-8">
                  Our Trusted Partners
                </p>
                <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                  {["remita", "paystack", "goxi", "flutter", "crc"].map((p) => (
                    <img
                      key={p}
                      src={`partners/${p}.png`}
                      alt={p}
                      className="h-8 w-auto object-contain"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Feature cards */}
          <section className="py-24 bg-white relative z-20 border-t border-slate-100">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
              <div className="text-center max-w-2xl mx-auto mb-16 reveal">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                  Everything you need to manage education costs.
                </h2>
                <p className="text-slate-500">
                  We designed SkulCredit with parents and schools in mind.
                  Simple, transparent, and incredibly fast.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "clock",
                    title: "Quick Application",
                    desc: "Complete your application in just 5 simple steps. Our automated system ensures you get approved within 48 hours without rigorous paperwork.",
                  },
                  {
                    icon: "wallet",
                    title: "Flexible Repayment",
                    desc: "Choose a payment plan that works for your budget. Spread repayment within a term at a one-off service charge.",
                  },
                  {
                    icon: "shield-check",
                    title: "Verified Schools",
                    desc: "All partner schools are vetted and accredited. Funds are remitted directly to the school's official account to ensure total security and trust.",
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className={`bg-slate-50 p-10 rounded-[2.5rem] hover:bg-white hover:shadow-card transition-all duration-500 group border border-transparent hover:border-slate-100 reveal delay-${(i + 1) * 100} hover:-translate-y-2 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-900 mb-6 group-hover:scale-110 group-hover:bg-rose-900 group-hover:text-white transition-all duration-500">
                        <Icon name={f.icon} className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mb-3">
                        {f.title}
                      </h3>
                      <p className="text-slate-500 leading-relaxed font-medium">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works – parents */}
          <section
            id="how-it-works"
            className="py-32 bg-[#F8FAFC] relative overflow-visible"
          >
            <div
              id="parent-section"
              className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10"
            >
              <div className="grid lg:grid-cols-12 gap-16 items-start">
                <div className="lg:col-span-5 lg:sticky lg:top-40 reveal-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 text-rose-900 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-rose-200/50">
                    <Icon name="zap" className="w-4 h-4" /> The Process
                  </div>
                  <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                    How It Works for <br />
                    <span className="text-rose-900">Parents</span>
                  </h2>
                  <p className="text-slate-500 text-lg mb-10 max-w-md">
                    Simple steps to get your child's tuition covered without the
                    stress.
                  </p>
                  <Link
                    to="/auth"
                    className="px-10 py-4 bg-rose-900 text-white rounded-full font-bold shadow-xl shadow-rose-900/20 hover:bg-rose-800 transition-colors inline-flex items-center gap-3"
                  >
                    Start Application{" "}
                    <Icon name="arrow-right" className="w-5 h-5" />
                  </Link>
                </div>

                <div className="lg:col-span-7 relative pb-[10vh]">
                  {[
                    {
                      num: "01",
                      title: "Create Your Profile",
                      desc: "Sign up using your verified email address or phone number. Our secure platform ensures your personal data remains heavily encrypted and protected from day one.",
                    },
                    {
                      num: "02",
                      title: "Submit Application",
                      desc: "Provide basic details about the student, select the verified partner school, and input the required tuition amount. The 5-step form takes less than 3 minutes to complete.",
                    },
                    {
                      num: "03",
                      title: "Instant Approval",
                      desc: "Our automated credit system instantly reviews your profile. Once approved, you simply accept the terms and select your preferred repayment structure within the term.",
                    },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className={`sticky top-${32 + i * 8} bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 mb-[20vh] z-${10 + i * 10} reveal-right delay-${i * 100} group`}
                    >
                      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-50 transition-colors border border-slate-100 group-hover:border-rose-100">
                          <span className="text-2xl font-black text-slate-300 group-hover:text-rose-900 transition-colors">
                            {step.num}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-4">
                            {step.title}
                          </h3>
                          <p className="text-slate-500 text-lg leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="sticky top-56 bg-rose-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_-20px_50px_-12px_rgba(136,19,55,0.4)] border border-rose-800 mb-6 z-40 reveal-right delay-300 group">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                      <div className="w-16 h-16 rounded-2xl bg-rose-800/80 flex items-center justify-center flex-shrink-0 border border-rose-700/50">
                        <span className="text-2xl font-black text-white">
                          04
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-4">
                          Tuition is Paid!
                        </h3>
                        <p className="text-rose-200 text-lg leading-relaxed">
                          Sit back and relax. We immediately disburse the total
                          funds directly to the school's bank account, and the
                          student's receipt is generated instantly.
                        </p>
                        <Link to="/parent/dashboard">
                          <button className="mt-8 px-6 py-3 bg-white text-rose-900 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                            View Dashboard Example
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose SkulCredit */}
          <section
            id="about"
            className="py-24 md:py-32 bg-rose-900 text-white relative overflow-hidden"
          >
            <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-12">
                  <div className="reveal-left">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                      Why Choose SkulCredit?
                    </h2>
                    <p className="text-rose-100 text-lg max-w-lg leading-relaxed">
                      Your trusted financial partner for education. We exist to
                      ensure that no child's learning is interrupted due to
                      temporary cash flow challenges.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        title: "Trusted by Schools",
                        sub: "Direct partnerships ensure safe, undisputed payments.",
                      },
                      {
                        title: "Flexible Repayment",
                        sub: "Spread repayment within a term at a one-off service charge.",
                      },
                      {
                        title: "Secure Verification",
                        sub: "Bank-level encryption and fast BVN/NIN checks.",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex gap-4 items-start reveal-left delay-${(i + 1) * 100} hover:translate-x-2 transition-transform`}
                      >
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                          <Icon
                            name="check"
                            className="w-4 h-4 text-rose-900 stroke-[3]"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{item.title}</h4>
                          <p className="text-rose-200/80 text-sm mt-1">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative reveal-scale delay-200 flex justify-center lg:justify-end">
                  <div className="relative bg-white p-3 rounded-[3rem] shadow-2xl">
                    <img
                      src="founder.png"
                      alt="Founder"
                      className="rounded-[2.8rem] object-cover h-[500px] w-full lg:w-[450px] bg-slate-50"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 animate-float-delayed flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Icon name="shield-check" className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-500">
                        100% Secure Platform
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 10 Reasons marquee */}
          <section className="py-24 bg-white overflow-hidden border-b border-slate-100">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl mb-16 text-center reveal">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                10 reasons Nigerian parents choose SkulCredit
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Designed to make school fee payments easier, more flexible, and
                less stressful every term.
              </p>
            </div>
            <div className="relative w-full flex overflow-hidden group reveal delay-200">
              <div className="animate-marquee marquee-wrapper gap-6 pr-6">
                {[0, 1].map((set) => (
                  <div key={set} className="flex items-center gap-6">
                    {REASONS.map((r) => (
                      <div
                        key={`${set}-${r.num}`}
                        className="w-[350px] p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex-shrink-0 hover:bg-white hover:shadow-xl transition-all"
                      >
                        <div
                          className={`w-9 h-9 rounded-full bg-${r.color}-100 text-${r.color}-700 font-bold text-sm flex items-center justify-center mb-5`}
                        >
                          {r.num}
                        </div>
                        <p className="text-slate-700 font-medium mb-6">
                          {r.desc}
                        </p>
                        <h4 className="font-bold text-sm text-slate-900">
                          {r.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ════════════════════════ SCHOOLS VIEW ════════════════════════ */}
        <div className={activeView === "schools" ? "block" : "hidden"}>
          <section className="bg-white pt-40 pb-48 text-center text-rose-900 relative z-0 overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10 reveal">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight max-w-4xl mx-auto">
                Making school fees simple, flexible, and stress-free
              </h1>
              <p className="text-rose-700 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                Apply once. Verify securely. Choose a plan. We pay your school,
                parents repay flexibly.
              </p>
            </div>
          </section>

          <section className="-mt-24 relative z-10 pb-24">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    icon: "clock",
                    title: "Quick Application",
                    desc: "Complete your application in just 5 simple steps. Get approved within 48 hours without any paperwork hassle.",
                  },
                  {
                    icon: "wallet",
                    title: "Flexible Repayment",
                    desc: "Offer parents a payment plan that works for their budget. Spread repayment within a term at a one-off service charge.",
                  },
                  {
                    icon: "shield-check",
                    title: "Verified Schools",
                    desc: "All partner schools are verified and accredited, ensuring quality education and guaranteed uninterrupted cash flows.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-rose-900 p-10 rounded-[2.5rem] text-center shadow-[0_20px_40px_-15px_rgba(136,19,55,0.25)] border border-rose-800 reveal hover:-translate-y-2 transition-transform duration-500"
                  >
                    <div className="w-16 h-16 bg-rose-800 rounded-full flex items-center justify-center text-white mx-auto mb-6">
                      <Icon name={item.icon} className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      {item.title}
                    </h3>
                    <p className="text-rose-100 leading-relaxed font-medium text-sm">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* School partner marquee */}
          <section className="py-24 bg-[#F8FAFC] border-t border-slate-100">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
              <div className="text-center max-w-2xl mx-auto mb-16 reveal">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 text-rose-900 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-rose-200/50">
                  <Icon name="award" className="w-4 h-4" /> Our Network
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  Prestigious Schools Trust Us
                </h2>
                <p className="text-slate-500 text-lg">
                  We are proud to partner with leading institutions to make
                  education accessible.
                </p>
              </div>
              <div className="relative w-full flex overflow-hidden group">
                <div className="animate-marquee marquee-wrapper items-center gap-12 pr-12">
                  {[0, 1].map((set) => (
                    <div
                      key={set}
                      className="flex items-center gap-12 flex-shrink-0"
                    >
                      {[
                        "336255632_705501197985278_7764329688078938542_n.jpg",
                        "images (1).jpg",
                        "images.jpg",
                      ].map((img, j) => (
                        <img
                          key={j}
                          src={`schools/${img}`}
                          alt="Partner School"
                          className="h-24 w-auto object-contain mix-blend-multiply rounded-[2rem] flex-shrink-0"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* How it works – schools */}
          <section className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                <div className="space-y-16 order-2 lg:order-1">
                  {[
                    {
                      num: "01",
                      title: "Create Account",
                      desc: "Sign up with your school's official email or phone number to access the partner portal and get started instantly.",
                    },
                    {
                      num: "02",
                      title: "Fill Application",
                      desc: "Provide basic details about your school, management, and student capacity in just a few easy, secure steps.",
                    },
                    {
                      num: "03",
                      title: "Get Approved",
                      desc: "Our dedicated compliance team reviews your submission and confirms your eligibility status quickly to activate your profile.",
                    },
                    {
                      num: "04",
                      title: "Fees Disbursed",
                      desc: "Once a parent is approved, we send the total tuition funds directly to your official school bank account.",
                    },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className={`relative reveal-left delay-${(i + 1) * 100}`}
                    >
                      <div className="absolute -top-10 -left-6 text-8xl font-black text-outline-rose pointer-events-none select-none">
                        {step.num}
                      </div>
                      <div className="relative z-10 pl-4">
                        <h3 className="text-2xl font-bold text-rose-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-slate-500 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-1 lg:order-2 text-center lg:text-right lg:pl-10 reveal-right">
                  <h2 className="text-5xl md:text-6xl font-extrabold text-rose-900 mb-6 tracking-tight leading-[1.1]">
                    How It Works for <br />
                    Partner School
                  </h2>
                  <p className="text-slate-600 text-lg md:text-xl mb-10 max-w-md ml-auto font-medium">
                    A simple process to help your students get their tuition
                    covered while guaranteeing your cash flow.
                  </p>
                  <Link to="/auth/school">
                    <button className="px-10 py-4 bg-rose-900 text-white rounded-full font-bold shadow-xl hover:bg-rose-800 transition-colors">
                      Start Application
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Eligibility criteria */}
          <section className="py-32 bg-[#F8FAFC]">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl reveal-scale">
              <div className="max-w-5xl mx-auto bg-white border-2 border-rose-900/10 rounded-[2.5rem] p-8 md:p-14 shadow-xl">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                  Eligibility Criteria:
                </h2>
                <p className="text-slate-600 font-medium mb-10">
                  To be eligible to join the Skulcredit network as a partner
                  school, your institution must meet the following requirements:
                </p>
                <ul className="space-y-6">
                  {SCHOOL_ELIGIBILITY.map((item, i) => (
                    <li key={i} className="flex items-start gap-5 group">
                      <div className="mt-1 flex-shrink-0 text-rose-800">
                        <Icon name="check" className="w-6 h-6 stroke-[3]" />
                      </div>
                      <p className="text-slate-700 font-medium group-hover:text-rose-900 transition-colors">
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* ════════════════ FAQ (always visible) ════════════════ */}
        <section
          id="faq"
          className="py-32 bg-slate-50 relative overflow-hidden"
        >
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
              <div className="lg:col-span-4 reveal-left">
                <div className="lg:sticky lg:top-32 text-left space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-bold uppercase tracking-wider">
                    Support
                  </div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Can't find the answer you're looking for? Reach out to our
                    customer support team anytime.
                  </p>
                  <a
                    href="#contact-us"
                    className="inline-flex items-center gap-2 text-rose-900 font-bold hover:gap-3 transition-all mt-4 border-b-2 border-rose-200 hover:border-rose-900 pb-1"
                  >
                    Contact Support{" "}
                    <Icon name="arrow-right" className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-4">
                {FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="bg-white border border-slate-200 rounded-[1.5rem] p-6 md:p-8 cursor-pointer hover:shadow-lg transition-all duration-300 group reveal-right"
                  >
                    <div className="flex justify-between items-center pointer-events-none">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-rose-900 transition-colors pr-4">
                        {item.q}
                      </h3>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transform transition-all duration-300 flex-shrink-0 ${activeFaq === i ? "bg-rose-900 text-white rotate-180" : "bg-slate-50 text-slate-900 group-hover:bg-rose-900 group-hover:text-white"}`}
                      >
                        <Icon name="chevron-down" className="w-5 h-5" />
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${activeFaq === i ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0"}`}
                    >
                      <p className="pt-6 leading-relaxed text-slate-600">
                        {item.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════ Waitlist / Contact ════════════════ */}
        <section id="contact-us" className="bg-white py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="bg-[#87144B] text-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 lg:p-16 shadow-lg relative overflow-hidden">
              <div className="absolute w-52 md:w-72 h-52 md:h-72 bg-white/10 rounded-full blur-3xl -top-16 -right-16" />
              <div className="absolute w-40 md:w-60 h-40 md:h-60 bg-black/20 rounded-full blur-3xl -bottom-16 -left-16" />
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
                <div>
                  <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">
                    Join the Waitlist
                  </h2>
                  <p className="text-white/80 text-sm md:text-base mb-6 md:mb-8">
                    We're building a better way to pay school fees. Join now and
                    be first in line.
                  </p>
                  <div className="space-y-3 md:space-y-4 text-sm md:text-base">
                    {[
                      { icon: "📞", text: "09168349890" },
                      { icon: "✉️", text: "hello@getskulcreditng.com" },
                    ].map((c) => (
                      <div
                        key={c.text}
                        className="flex items-center gap-3 md:gap-4"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center">
                          {c.icon}
                        </div>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  action="https://formsubmit.co/hello@getskulcreditng.com"
                  method="POST"
                  onSubmit={handleWaitlistSubmit}
                  className="space-y-3 md:space-y-4"
                >
                  <input
                    type="hidden"
                    name="_subject"
                    value="New Lead - SkulCredit"
                  />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="User Type" value={waitlistType} />

                  <div className="flex gap-3 mb-2">
                    {(["parent", "school"] as WaitlistType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setWaitlistType(t)}
                        className={`px-4 py-2 rounded-lg text-xs md:text-sm font-medium capitalize ${waitlistType === t ? "bg-white text-[#87144B]" : "bg-white/20 text-white"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {waitlistType === "parent" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          name="First Name"
                          type="text"
                          placeholder="First name"
                          required
                          className="px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                        />
                        <input
                          name="Last Name"
                          type="text"
                          placeholder="Last name"
                          required
                          className="px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                        />
                      </div>
                      <input
                        name="Email"
                        type="email"
                        placeholder="Email address"
                        required
                        className="w-full px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                      />
                      <textarea
                        name="Message"
                        rows={3}
                        placeholder="Message (optional)"
                        className="w-full px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                      />
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          name="School Name"
                          type="text"
                          placeholder="School Name"
                          required
                          className="px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                        />
                        <input
                          name="Contact Person"
                          type="text"
                          placeholder="Contact Person"
                          required
                          className="px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          name="Email"
                          type="email"
                          placeholder="Official Email"
                          required
                          className="px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                        />
                        <input
                          name="Phone Number"
                          type="tel"
                          placeholder="Phone Number"
                          required
                          className="px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none"
                        />
                      </div>
                      <textarea
                        name="School Address"
                        rows={2}
                        placeholder="Full physical address"
                        required
                        className="w-full px-3 py-2 md:py-3 text-sm rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none resize-none"
                      />
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={waitlistStatus === "loading"}
                    className="w-full bg-white text-[#87144B] py-2 md:py-3 rounded-lg text-sm font-medium hover:scale-[1.02] transition disabled:opacity-50"
                  >
                    {waitlistStatus === "loading"
                      ? "Submitting…"
                      : "Join Waitlist"}
                  </button>
                  {waitlistStatus === "success" && (
                    <p className="text-green-300 text-xs">
                      ✅ Submitted successfully! We will be in touch.
                    </p>
                  )}
                  {waitlistStatus === "error" && (
                    <p className="text-rose-300 text-xs">
                      ❌ An error occurred. Please try again.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ── Shared marketing footer ─────────────────────── */}
        <PublicFooter />
      </main>
    </>
  );
};

export default HomePage;
