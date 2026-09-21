import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardTopBar from "./DashboardTopBar";

interface SchoolTopBarProps {
  notificationCount?: number;
  left?: ReactNode;
}

const SchoolTopBar: React.FC<SchoolTopBarProps> = ({
  notificationCount = 0,
  left,
}) => {
  const { user } = useAuth();
  const initials = (user?.name ?? "SC").slice(0, 2).toUpperCase();

  const right = (
    <div className="flex items-center gap-4">
      <button className="flex items-center gap-1.5 text-brand font-semibold text-sm relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Notification
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
      <div className="w-10 h-10 rounded-full bg-brand border-2 border-white shadow flex items-center justify-center text-white font-bold text-sm select-none">
        {initials}
      </div>
    </div>
  );

  return (
    <DashboardTopBar
      left={left}
      notificationCount={notificationCount}
      rightExtra={right}
    />
  );
};

export default SchoolTopBar;
