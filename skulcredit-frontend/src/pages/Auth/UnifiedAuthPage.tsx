import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';

const UnifiedAuthPage: React.FC = () => (
  <>
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 flex justify-center items-center overflow-hidden bg-[#F8FAFC]">
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-rose-200/50 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
      <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
    </div>

    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[800px] mx-auto bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(136,19,55,0.15),inset_0_0_0_1px_rgba(255,255,255,0.9)] relative z-10 transition-all duration-500">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <img src="/logo_nav.png" alt="SkulCredit" className="h-14 w-auto mx-auto" />
          </Link>
          <h1 className="text-3xl font-extrabold mb-3 text-slate-900">Welcome to SkulCredit</h1>
          <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">Please select your account type to proceed to the secure login portal.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/auth/parent" className="group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand/30 transition-all duration-300 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-brand mb-4 group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all duration-300">
              <Icon name="user" className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">I am a Parent</h3>
            <p className="text-xs text-slate-500 font-medium">Apply for loans, track status, and manage repayment.</p>
          </Link>

          <Link to="/auth/school" className="group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <Icon name="graduation-cap" className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">I am a School</h3>
            <p className="text-xs text-slate-500 font-medium">Verify students, track disbursements, and view stats.</p>
          </Link>
        </div>
      </div>
    </div>
  </>
);

export default UnifiedAuthPage;
