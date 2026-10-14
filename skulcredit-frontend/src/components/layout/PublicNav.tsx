import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';

type ActiveView = 'home' | 'schools';

interface PublicNavProps {
  activeView: ActiveView;
  onSetView: (view: ActiveView) => void;
  onScrollTo: (sectionId: string) => void;
}

const PublicNav: React.FC<PublicNavProps> = ({ activeView, onSetView, onScrollTo }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkCls = (view: ActiveView) =>
    `text-sm font-bold relative group nav-link ${
      activeView === view
        ? 'text-rose-900'
        : 'text-slate-600 hover:text-rose-900 transition-colors'
    }`;

  const indicator = (view: ActiveView) =>
    `absolute -bottom-1 left-0 w-full h-[2px] bg-rose-900 origin-left transition-transform ${
      activeView === view ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
    }`;

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 py-4">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-6 py-3 shadow-glass">
          <img
            src="logo_nav.png"
            alt="SkulCredit"
            className="h-16 w-28 w-auto cursor-pointer"
            onClick={() => onSetView('home')}
          />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onSetView('home')} className={linkCls('home')}>
              Home <span className={indicator('home')} />
            </button>
            <button onClick={() => onScrollTo('how-it-works')} className="text-sm font-medium text-slate-600 hover:text-rose-900 transition-colors relative group">
              How it Works <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-rose-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </button>
            <button onClick={() => onScrollTo('about')} className="text-sm font-medium text-slate-600 hover:text-rose-900 transition-colors relative group">
              Why Us <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-rose-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </button>
            <button onClick={() => onScrollTo('faq')} className="text-sm font-medium text-slate-600 hover:text-rose-900 transition-colors relative group">
              FAQ <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-rose-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </button>
            <button onClick={() => onSetView('schools')} className={linkCls('schools')}>
              For Schools <span className={indicator('schools')} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="inline-block bg-rose-900 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg hover:bg-rose-800 transition-colors"
            >
              Get Started
            </Link>
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 flex flex-col gap-6">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full"
          >
            <Icon name="x" className="w-6 h-6" />
          </button>
          <button onClick={() => { onSetView('home'); setMobileOpen(false); }} className="text-2xl font-bold text-slate-900 text-left">Home</button>
          <button onClick={() => { onSetView('schools'); setMobileOpen(false); }} className="text-2xl font-bold text-slate-900 text-left">For Schools</button>
          <button onClick={() => { onScrollTo('how-it-works'); setMobileOpen(false); }} className="text-2xl font-bold text-slate-500 text-left">How it Works</button>
          <button onClick={() => { onScrollTo('faq'); setMobileOpen(false); }} className="text-2xl font-bold text-slate-500 text-left">FAQ</button>
          <div className="h-px bg-slate-100 my-2" />
          <Link to="/auth" className="w-full py-4 bg-rose-900 text-white rounded-xl font-bold text-lg text-center">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};

export default PublicNav;
