import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import SidebarShell from './SidebarShell';
import { useAuth } from '../../context/AuthContext';

export type AdminTab = 'overview' | 'schools' | 'applications' | 'disbursements';

const NAV_ITEMS: { tab: AdminTab; icon: string; label: string }[] = [
  { tab: 'overview',       icon: 'layout-dashboard', label: 'Overview'         },
  { tab: 'schools',        icon: 'building-2',       label: 'Manage Schools'   },
  { tab: 'applications',   icon: 'file-text',        label: 'All Applications' },
  { tab: 'disbursements',  icon: 'send',             label: 'Disbursements'    },
];

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const btnCls = (tab: AdminTab) =>
    `w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
      activeTab === tab
        ? 'bg-purple-50 text-purple-700'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <SidebarShell
      logo={
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_nav.png" alt="SkulCredit" className="h-10 w-auto" />
        </Link>
      }
      nav={
        <>
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">System</p>
          {NAV_ITEMS.map(({ tab, icon, label }) => (
            <button key={tab} onClick={() => onTabChange(tab)} className={btnCls(tab)}>
              <Icon name={icon} className="w-5 h-5" />
              {label}
            </button>
          ))}
        </>
      }
      footer={
        <>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Icon name="log-out" className="w-5 h-5" />
            Logout
          </button>
        </>
      }
    />
  );
};

export default AdminSidebar;
