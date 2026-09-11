import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../Icon';
import SidebarShell from './SidebarShell';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/school/dashboard',    icon: 'layout-dashboard', label: 'Dashboard'    },
  { to: '/school/students',     icon: 'users',            label: 'Students'     },
  { to: '/school/applications', icon: 'file-text',        label: 'Applications' },
  { to: '/school/settings',     icon: 'shield-check',     label: 'Verification' },
  { to: '/school/disbursement', icon: 'credit-card',      label: 'Disbursement' },
];

const SchoolSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/auth/school');
  };

  const linkCls = (path: string) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all group ${
      isActive(path)
        ? 'bg-brand text-white shadow-[0_4px_12px_rgba(136,19,55,0.2)]'
        : 'text-slate-700 hover:bg-slate-50 hover:text-brand'
    }`;

  return (
    <SidebarShell
      logo={
        <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black">S</div>
          <div>
            <h1 className="text-xl font-extrabold text-brand leading-none tracking-tight">SkulCredit</h1>
            <p className="text-[9px] text-brand/70 font-bold uppercase tracking-widest mt-0.5">Partner Portal</p>
          </div>
        </Link>
      }
      nav={
        <>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={linkCls(to)}>
              <Icon
                name={icon}
                className={`w-5 h-5 ${isActive(to) ? '' : 'text-slate-500 group-hover:text-brand transition-colors'}`}
              />
              {label}
            </Link>
          ))}
          <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand transition-all group mt-2">
            <Icon name="headset" className="w-5 h-5 text-slate-500 group-hover:text-brand transition-colors" />
            Support
          </button>
        </>
      }
      footer={
        <>
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
              SC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name ?? 'School Admin'}</p>
              <p className="text-xs text-slate-500">Partner</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 font-semibold hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <Icon name="log-out" className="w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors" />
            Logout
          </button>
        </>
      }
    />
  );
};

export default SchoolSidebar;
