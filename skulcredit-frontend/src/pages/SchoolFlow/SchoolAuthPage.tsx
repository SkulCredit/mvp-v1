import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';

type SchoolView = 'login' | 'signup' | 'forgot';

interface RegData {
  schoolName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  website: string;
  population: string;
  password: string;
  confirmPassword: string;
}

const SchoolAuthPage: React.FC = () => {
  const [view, setView] = useState<SchoolView>('login');
  const [email, setEmail] = useState('school@test.com');
  const [password, setPassword] = useState('school123');
  const [error, setError] = useState('');
  const [regError, setRegError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regData, setRegData] = useState<RegData>({
    schoolName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    website: '',
    population: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { login, register } = useAuth();

  useEffect(() => {
    if ((window as unknown as { lucide?: { createIcons?: () => void } }).lucide?.createIcons) {
      (window as unknown as { lucide: { createIcons: () => void } }).lucide.createIcons();
    }
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password, 'school');
      navigate('/school/dashboard');
    } catch (err) {
      setError((err as Error).message ?? 'Invalid school credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsLoading(true);
    if (regData.password !== regData.confirmPassword) {
      setIsLoading(false);
      setRegError('Passwords do not match.');
      return;
    }
    try {
      await register(
        {
          schoolName: regData.schoolName,
          contactPerson: regData.contactPerson,
          email: regData.email,
          password: regData.password,
          phoneNumber: regData.phoneNumber,
        },
        'school',
      );
      navigate('/school/dashboard?status=pending');
    } catch (err) {
      setRegError((err as Error).message ?? 'Failed to register. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateReg = (field: keyof RegData, value: string) =>
    setRegData((p) => ({ ...p, [field]: value }));

  return (
    <>
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 flex justify-center items-center overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-slate-200/60 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-[500px] bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(136,19,55,0.1)] relative z-10 transition-all duration-500">

        {/* LOGIN */}
        {view === 'login' && (
          <div className="block animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/logo.png" alt="Skulcredit Logo" className="w-10 h-10 object-contain" />
                <h1 className="text-2xl font-extrabold text-brand tracking-tight">SkulCredit</h1>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">
                <Icon name="building-2" className="w-3.5 h-3.5" /> Partner Portal
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">Welcome Back</h2>
              <p className="text-sm text-slate-500 font-medium">Log in to manage your students and disbursements.</p>
            </div>
            <form className="space-y-5" onSubmit={handleLogin}>
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>}
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">School Admin Email*</label>
                <input type="email" placeholder="admin@school.edu.ng" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
              </div>
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Password*</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors">
                    <Icon name={showPassword ? 'eye' : 'eye-off'} className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 checked:bg-brand checked:border-brand transition-all cursor-pointer outline-none focus:ring-4 focus:ring-brand/20" />
                    <Icon name="check" className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">Remember me</span>
                </label>
                <button type="button" onClick={() => setView('forgot')} className="text-sm font-bold text-brand hover:text-brand-light transition-colors">
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={isLoading}
                className="relative w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(136,19,55,0.5)] mt-6 flex items-center justify-center gap-2 group disabled:opacity-70">
                <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                {!isLoading && <Icon name="arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
              <p className="text-center text-sm text-slate-500 font-medium mt-6">
                Not registered yet?
                <button type="button" onClick={() => setView('signup')} className="font-bold text-brand hover:text-brand-light transition-colors ml-1">Apply as Partner</button>
              </p>
            </form>
          </div>
        )}

        {/* SIGN UP */}
        {view === 'signup' && (
          <div className="block animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/logo.png" alt="Skulcredit Logo" className="w-10 h-10 object-contain" />
                <h1 className="text-2xl font-extrabold text-brand tracking-tight">SkulCredit</h1>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1.5">Create Partner Account</h2>
              <p className="text-sm text-slate-500 font-medium">Join our network to receive fast tuition payments.</p>
            </div>
            <form className="space-y-4" onSubmit={handleRegister}>
              {regError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{regError}</div>}

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">School Name*</label>
                <input type="text" placeholder="Official Institution Name" required value={regData.schoolName} onChange={(e) => updateReg('schoolName', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Contact Person*</label>
                  <input type="text" placeholder="Full Name" required value={regData.contactPerson} onChange={(e) => updateReg('contactPerson', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Phone Number*</label>
                  <input type="tel" placeholder="+234..." required value={regData.phoneNumber} onChange={(e) => updateReg('phoneNumber', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Official Email Address*</label>
                <input type="email" placeholder="admin@school.edu.ng" required value={regData.email} onChange={(e) => updateReg('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">School Address*</label>
                <textarea rows={2} placeholder="Full physical address" required value={regData.address} onChange={(e) => updateReg('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Website / Social Media*</label>
                  <input type="text" placeholder="https:// or @handle" required value={regData.website} onChange={(e) => updateReg('website', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">School Population*</label>
                  <input type="number" placeholder="Estimated students" required min="10" value={regData.population} onChange={(e) => updateReg('population', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">CAC / School Licence Upload*</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-100 bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center text-center px-4">
                    <Icon name="upload-cloud" className="w-6 h-6 text-brand mb-1" />
                    <p className="text-xs text-slate-600 font-bold">Click to upload document</p>
                  </div>
                  <input type="file" required onChange={() => {}} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Password*</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars" required value={regData.password} onChange={(e) => updateReg('password', e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors">
                      <Icon name={showPassword ? 'eye' : 'eye-off'} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Confirm*</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter" required value={regData.confirmPassword} onChange={(e) => updateReg('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 pr-10" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors">
                      <Icon name={showConfirmPassword ? 'eye' : 'eye-off'} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 pb-1 text-center text-xs text-slate-500 font-medium leading-relaxed">
                By registering, you agree to the Partner
                <a href="#" className="font-bold text-brand hover:underline ml-1">Terms of Service</a>
              </div>

              <button type="submit" disabled={isLoading}
                className="relative w-full bg-brand text-white font-bold py-4 rounded-2xl hover:bg-brand-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(136,19,55,0.5)] flex items-center justify-center gap-2 group disabled:opacity-70">
                <span>{isLoading ? 'Submitting...' : 'Submit Application'}</span>
                {!isLoading && <Icon name="arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>

              <p className="text-center text-sm text-slate-500 font-medium mt-6">
                Already a partner?
                <button type="button" onClick={() => setView('login')} className="font-bold text-brand hover:text-brand-light transition-colors ml-1">Sign In</button>
              </p>
            </form>
          </div>
        )}

        {/* FORGOT */}
        {view === 'forgot' && (
          <div className="block animate-fade-in-up py-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
                <Icon name="key-round" className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Admin Password Reset</h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[90%] mx-auto">
                Enter your registered school email address. We'll send instructions to reset your access.
              </p>
            </div>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-brand transition-colors">Official Email Address*</label>
                <input type="email" placeholder="admin@school.edu.ng" required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400" />
              </div>
              <button type="submit"
                className="relative w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all duration-300 shadow-md flex items-center justify-center gap-2 group">
                <span>Send Reset Link</span>
                <Icon name="send" className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <p className="text-center text-sm text-slate-500 font-medium mt-6">
                Remembered your password?
                <button type="button" onClick={() => setView('login')} className="font-bold text-brand hover:text-brand-light transition-colors ml-1">Back to Login</button>
              </p>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default SchoolAuthPage;
