import React, { useState } from 'react';

const PublicFooter: React.FC = () => {
  const [_email, setEmail] = useState('');

  return (
    <footer className="bg-[#87144B] text-white pt-12 md:pt-16 pb-8 md:pb-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-white rounded-full blur-3xl top-[-80px] left-[-80px]" />
        <div className="absolute w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-black rounded-full blur-3xl bottom-[-80px] right-[-80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-12 text-sm md:text-base">
          <div>
            <img src="logo_white.png" className="h-16 md:h-14 mb-3 md:mb-4 ml-[-20px]" alt="SkulCredit" />
            <p className="text-white/80 text-xs md:text-sm leading-relaxed">
              Making education accessible through smart financing solutions.
            </p>
            <div className="flex gap-3 md:gap-4 mt-4 md:mt-6">
              <a href="mailto:hello@getskulcreditng.com" className="opacity-80 hover:opacity-100 transition-opacity">
                <img src="https://cdn.simpleicons.org/gmail/ffffff" className="w-4 md:w-5 h-4 md:h-5" alt="Email" />
              </a>
              <a href="https://x.com/skulcredit" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <img src="https://cdn.simpleicons.org/x/ffffff" className="w-4 md:w-5 h-4 md:h-5" alt="X" />
              </a>
              <a href="https://www.linkedin.com/company/skulcredit/" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <img src="https://cdn-icons-png.flaticon.com/512/145/145807.png" className="w-4 md:w-5 h-4 md:h-5" alt="LinkedIn" />
              </a>
              <a href="https://www.instagram.com/skulcredit" target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <img src="https://cdn.simpleicons.org/instagram/ffffff" className="w-4 md:w-5 h-4 md:h-5" alt="Instagram" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Platform</h4>
            <ul className="space-y-2 md:space-y-3 text-white/80 text-xs md:text-sm">
              <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Parents</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Schools</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Company</h4>
            <ul className="space-y-2 md:space-y-3 text-white/80 text-xs md:text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Newsletter</h4>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2 md:space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button
                type="submit"
                className="w-full bg-white text-[#87144B] py-2 md:py-3 text-xs md:text-sm rounded-lg font-medium hover:scale-[1.02] transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/20 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-white/60">
          <p>© 2026 SkulCredit. All rights reserved.</p>
          <div className="flex gap-4 md:gap-6 mt-2 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
