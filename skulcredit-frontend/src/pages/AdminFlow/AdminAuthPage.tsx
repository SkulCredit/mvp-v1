import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/Icon";

const AdminAuthPage: React.FC = () => {
  const [email, setEmail] = useState("admin@skulcredit.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password, "admin");
      navigate("/admin/dashboard");
    } catch {
      setError(
        "Invalid admin credentials. Try admin@skulcredit.com / admin123",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 flex justify-center items-center overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-purple-200/60 rounded-full mix-blend-multiply filter blur-[80px] animate-blob" />
        <div
          className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-brand-light/30 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="w-full max-w-[500px] mx-auto mt-20 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(88,28,135,0.1)] relative z-10 transition-all duration-500">
        <div className="text-center mb-8">
          <img
            src="/logo_nav.png"
            alt="SkulCredit"
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-purple-200">
            <Icon name="shield" className="w-3.5 h-3.5" /> System Admin
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1.5">
            Admin Login
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Restricted access portal.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}
          <div className="group">
            <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-purple-600 transition-colors">
              Admin Email*
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400"
            />
          </div>
          <div className="group">
            <label className="block text-sm font-bold text-slate-700 mb-1.5 group-focus-within:text-purple-600 transition-colors">
              Password*
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 pr-12"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Icon name="eye-off" className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full bg-purple-900 text-white font-bold py-4 rounded-2xl hover:bg-purple-800 transition-all duration-300 mt-6 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            <span>{isLoading ? "Authenticating..." : "Secure Login"}</span>
            {!isLoading && <Icon name="lock" className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </>
  );
};

export default AdminAuthPage;
