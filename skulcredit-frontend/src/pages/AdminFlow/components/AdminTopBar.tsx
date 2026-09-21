import React from "react";
import Icon from "../../../components/Icon";
import { useAuth } from "../../../context/AuthContext";

const AdminTopBar: React.FC = () => {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "FA";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-4 px-6 shrink-0 z-10">
      {/* search */}
      <div className="flex items-center gap-2 flex-1 max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <Icon name="search" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
          placeholder="Search applicants, loans, schools..."
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* system status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">System Live</span>
        </div>

        {/* bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <Icon name="bell" className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#881337] rounded-full" />
        </button>

        {/* user */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#881337]/10 flex items-center justify-center text-[#881337] font-bold text-xs">
            {initials}
          </div>
          <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
            {user?.name ?? "Fashanu Ayomide"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
