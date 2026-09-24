import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  from: "bot" | "user";
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  "Check application status",
  "Payment support",
  "Technical issue",
  "Talk to a human",
];

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-2.5">
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5">
      <img
        src="/bot-image.jpeg"
        alt="Support bot"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex flex-col gap-1 max-w-[78%]">
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-slate-400"
          style={{
            animation: "chatBotBounce 1.2s ease-in-out infinite",
            animationDelay: "0ms",
          }}
        />
        <span
          className="w-2 h-2 rounded-full bg-slate-400"
          style={{
            animation: "chatBotBounce 1.2s ease-in-out infinite",
            animationDelay: "200ms",
          }}
        />
        <span
          className="w-2 h-2 rounded-full bg-slate-400"
          style={{
            animation: "chatBotBounce 1.2s ease-in-out infinite",
            animationDelay: "400ms",
          }}
        />
      </div>
    </div>
  </div>
);

const chatBotStyles = `
@keyframes chatBotBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}
@keyframes chatBotFadeSlide {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.chatbot-msg-in {
  animation: chatBotFadeSlide 0.22s ease-out forwards;
}
`;

const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      from: "bot",
      text: "Hello! 👋\nHow can I help you today?",
      time: now(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setShowQuickReplies(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        from: "user",
        text: text.trim(),
        time: now(),
      },
    ]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          from: "bot",
          text: "Thanks for reaching out! A support agent will get back to you shortly.",
          time: now(),
        },
      ]);
    }, 1600);
  };

  const handleQuickReply = (text: string) => sendMessage(text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <style>{chatBotStyles}</style>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] max-h-[540px] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-fade-in-up">
          <div className="flex items-center gap-3 px-5 py-4 bg-brand">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/bot-image.jpeg"
                alt="Support bot"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-tight">
                Customer Service
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isTyping ? (
                  <>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-green-300"
                      style={{
                        animation: "chatBotBounce 1.2s ease-in-out infinite",
                      }}
                    />
                    <p className="text-white/80 text-xs">Typing…</p>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <p className="text-white/70 text-xs">
                      We're here to help you
                    </p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
              aria-label="Close chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-4 space-y-4 max-h-[360px] scrollbar-thin scrollbar-thumb-slate-200">
            {messages.map((msg) => (
              <div key={msg.id} className="chatbot-msg-in">
                {msg.from === "bot" ? (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5">
                      <img
                        src="/bot-image.jpeg"
                        alt="Support bot"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1 max-w-[78%]">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-slate-100">
                        <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="flex flex-col items-end gap-1 max-w-[78%]">
                      <div className="bg-brand rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                        <p className="text-sm text-white leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 pr-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}

            {showQuickReplies && !isTyping && (
              <div className="flex flex-col gap-2 pl-10">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="self-start px-4 py-2 rounded-full border border-brand text-brand text-xs font-semibold hover:bg-brand hover:text-white transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 bg-white border-t border-slate-100"
          >
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand transition-colors shrink-0"
              aria-label="Attach file"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-full bg-brand flex items-center justify-center shrink-0 hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!open && (
          <div className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
            Chat with us
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat"}
          className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-[0_8px_24px_rgba(136,19,55,0.35)] transition-all hover:scale-105 active:scale-95"
        >
          {open ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <div className="relative">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="9" cy="10" r="1" fill="white" stroke="none" />
                <circle cx="12" cy="10" r="1" fill="white" stroke="none" />
                <circle cx="15" cy="10" r="1" fill="white" stroke="none" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center leading-none">
                1
              </span>
            </div>
          )}
        </button>
      </div>
    </>
  );
};

export default ChatBot;
