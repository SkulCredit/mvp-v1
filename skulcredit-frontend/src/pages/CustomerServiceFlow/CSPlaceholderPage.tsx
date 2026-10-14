import React from "react";
import { useNavigate } from "react-router-dom";

const BRAND = "#7A0E42";

interface Props {
  title: string;
  description: string;
  icon: string;
}

const CSPlaceholderPage: React.FC<Props> = ({ title, description, icon }) => {
  const navigate = useNavigate();
  return (
    <div className="pt-6 pb-12 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
           style={{ backgroundColor: "rgba(122,14,66,0.08)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round"
             className="w-8 h-8" style={{ color: BRAND }} aria-hidden="true">
          <path d={icon} />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 max-w-sm text-center">{description}</p>
      <button
        onClick={() => navigate("/cs/dashboard")}
        className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: BRAND }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#5e0a31")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND)}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default CSPlaceholderPage;
