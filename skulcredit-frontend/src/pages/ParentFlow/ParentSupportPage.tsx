import React, { useState } from "react";
import {
  ChatIcon,
  ChevronDownIcon,
  MailIcon,
  PhoneIcon,
  SendIcon,
  SupportIcon,
} from "../../components/ui/NavIcons";

import type { FaqItem, SupportMessage } from "../../components/types/supports";

// Inline shield icon for the note hint
const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CONTACT_CHANNELS = [
  {
    icon: PhoneIcon,
    title: "Phone Support",
    detail: "+234 800-700-01 SKULCREDIT",
    meta: "Mon-Fri: 8am - 6pm WAT",
    action: "Call Now",
    href: "tel:+2348007550100",
  },
  {
    icon: MailIcon,
    title: "Email Support",
    detail: "support@skulcredit.com",
    meta: "Response within 24 hours",
    action: "Send Email",
    href: "mailto:support@skulcredit.com",
  },
  {
    icon: ChatIcon,
    title: "Live Chat",
    detail: "Chat with our team",
    meta: "Available 9am -5pm",
    action: "Start Chat",
    href: "#chat",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    question: "Who can apply for Skulcredit?",
    answer:
      "Any parent or guardian with a child enrolled in an eligible school can apply for Skulcredit tuition financing.",
  },
  {
    id: "2",
    question: "Do I need to be employed to qualify?",
    answer:
      "No, employment is not mandatory. We consider various income sources to assess eligibility.",
  },
  {
    id: "3",
    question: "How do I know my school is eligible?",
    answer:
      "You can check school eligibility during the application process or contact our support team.",
  },
  {
    id: "4",
    question: "How fast is the approval process?",
    answer:
      "Approvals typically happen within 24–48 hours after submission of a complete application.",
  },
  {
    id: "5",
    question: "Where does the money go after approval?",
    answer:
      "Funds are disbursed directly to your child's school, not to your personal account.",
  },
  {
    id: "6",
    question: "What repayment options are available?",
    answer:
      "We offer flexible repayment schedules — monthly installments tailored to your income.",
  },
  {
    id: "7",
    question: "What happens if I miss a repayment?",
    answer:
      "A late fee may apply. Please contact support immediately to restructure your repayment plan.",
  },
  {
    id: "8",
    question: "Is my personal data safe with Skulcredit?",
    answer:
      "Yes. All data is encrypted and stored securely in compliance with Nigerian data protection regulations.",
  },
  {
    id: "9",
    question: "Are there hidden fees or charges?",
    answer:
      "No hidden fees. All charges are clearly stated before you accept the loan offer.",
  },
  {
    id: "10",
    question: "Can students apply directly?",
    answer:
      "No, applications must be made by a parent or guardian on behalf of the student.",
  },
];

const ParentSupportPage: React.FC = () => {
  const [form, setForm] = useState<SupportMessage>({
    subject: "",
    message: "",
  });
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setIsSending(true);
    await new Promise((res) => setTimeout(res, 1200));
    setForm({ subject: "", message: "" });
    setIsSending(false);
  };

  return (
    <div className="flex flex-col gap-6 mt-12 w-[90%] mx-auto animate-fade-in-up">
      {/* ── Help & Support banner ── */}
      <div className="rounded-2xl bg-[#8B1C53] px-6 pt-8 pb-6 text-white text-center">
        <h2 className="text-xl font-bold">Help &amp; Support</h2>
        <p className="mt-1 text-sm text-white/70">
          We're here to help you with any questions or concerns
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTACT_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.title}
                className="rounded-xl bg-white px-5 py-6 flex flex-col items-center gap-3 text-center"
              >
                {/* icon in light-pink circle */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B1C53]/10">
                  <Icon className="text-[#8B1C53]" />
                </div>

                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-gray-800">
                    {ch.title}
                  </p>
                  <p className="text-xs text-gray-500">{ch.detail}</p>
                  <p className="text-xs text-gray-400">{ch.meta}</p>
                </div>

                <a href={ch.href} className="w-full mt-1">
                  <button className="w-full rounded-lg border border-[#8B1C53] px-4 py-2 text-xs font-semibold text-[#8B1C53] bg-white hover:bg-[#8B1C53]/5 transition-colors">
                    {ch.action}
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Send us a Message ── */}
      <div
        className="rounded-xl bg-white px-6 py-6"
        style={{ border: "1px solid #8D8D8D" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <SendIcon className="text-gray-800 w-5 h-5" />
          <p className="text-base font-bold text-gray-900">Send us a Message</p>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-4">
          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="What do you need help with?"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              placeholder="Please provide detailed information as much as possible...."
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none resize-none focus:border-[#8B1C53] focus:ring-2 focus:ring-[#8B1C53]/20"
            />
          </div>

          {/* Hint note */}
          <div className="flex items-start gap-1.5">
            <ShieldIcon className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              We typically respond within 24 hours during business days. For
              urgent matters, please call our support line.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              type="submit"
              disabled={isSending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8B1C53] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7a1848] transition-colors disabled:opacity-60"
            >
              <SendIcon className="w-4 h-4 text-white" />
              {isSending ? "Sending..." : "Send Message"}
            </button>
            <button
              type="button"
              onClick={() => setForm({ subject: "", message: "" })}
              className="rounded-lg border border-[#8B1C53] px-5 py-3 text-sm font-semibold text-[#8B1C53] bg-white hover:bg-[#8B1C53]/5 transition-colors"
            >
              Clear Message
            </button>
          </div>
        </form>
      </div>

      {/* ── Frequently Asked Questions ── */}
      <div
        className="rounded-xl bg-white px-6 py-6"
        style={{ border: "1px solid #8D8D8D" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <SupportIcon className="text-gray-500 w-4 h-4" />
          <p className="text-sm font-bold text-gray-900">
            Frequently Asked Questions
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((faq) => (
            <div
              key={faq.id}
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid #BFBFBF" }}
            >
              <button
                onClick={() =>
                  setOpenFaq((prev) => (prev === faq.id ? null : faq.id))
                }
                className="flex w-full items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-800">{faq.question}</span>
                {/* dark maroon filled circle chevron */}
                <span className="shrink-0 ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#8B1C53]">
                  <ChevronDownIcon
                    className={`text-white w-4 h-4 transition-transform duration-200 ${
                      openFaq === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {openFaq === faq.id && (
                <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentSupportPage;
