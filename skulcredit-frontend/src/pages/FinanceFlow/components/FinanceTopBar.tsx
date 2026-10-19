import React, { useState } from "react";
import {
  Bell,
  Menu,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";

interface FinanceTopBarProps {
  onOpenMobileMenu?: () => void;
  breadcrumb?: string;
  showSearch?: boolean;
}

const FinanceTopBar: React.FC<FinanceTopBarProps> = ({
  onOpenMobileMenu,
  breadcrumb,
  showSearch = true,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="h-16 px-4 sm:px-6 md:px-8 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {breadcrumb ? (
          <div className="text-xs sm:text-sm font-medium text-gray-400 flex items-center gap-1.5">
            <span className="text-[#700936] font-semibold">Finance operations</span>
            <span>/</span>
            <span className="text-[#700936] font-semibold">{breadcrumb}</span>
          </div>
        ) : (
          <div className="hidden md:block" />
        )}
      </div>

      {/* Middle: Quick search bar */}
      {showSearch && (
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search IDs, schools, parents..."
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50/70 border border-gray-200 rounded-full text-xs placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#700936] transition-all"
            />
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#700936] rounded-full border border-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in-up">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Finance Alerts (4)
                </h4>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] text-[#700936] font-semibold hover:underline"
                >
                  Mark read
                </button>
              </div>
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                <div className="py-2.5 text-xs text-gray-700">
                  <span className="font-semibold block text-gray-900">12 Disbursements awaiting</span>
                  Batch ready for L2 financial release.
                </div>
                <div className="py-2.5 text-xs text-gray-700">
                  <span className="font-semibold block text-red-600">7 Failed Transactions</span>
                  Settlement retry required for Providus rail.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar with label */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#fce7ef] text-[#700936] font-bold text-xs flex items-center justify-center border border-[#fad2e1]">
              AB
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:inline-block">
              Finance Officer
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900">Adewale Bello</p>
                <p className="text-[11px] text-gray-500">Finance Officer</p>
              </div>
              <Link
                to="/finance/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                <User className="w-3.5 h-3.5 text-gray-400" />
                Finance Portal
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  window.location.href = "/auth";
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default FinanceTopBar;
