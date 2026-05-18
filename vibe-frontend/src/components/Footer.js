import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiLinkedin, FiInstagram } from 'react-icons/fi';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-gray-300 mt-20 border-t border-slate-700">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">V.I.B.E</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Validated Intelligent Bidding Engine - A real-time auction platform with advanced fraud detection powered by machine learning.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FiMapPin size={18} className="text-amber-400" />
                <span>Air University, Islamabad, Pakistan</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FiPhone size={18} className="text-amber-400" />
                <span>+92 (51) 9024-5678</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FiMail size={18} className="text-amber-400" />
                <span>contact@vibe-auction.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-amber-400 transition">Home</a></li>
              <li><a href="/" className="text-gray-400 hover:text-amber-400 transition">Browse Auctions</a></li>
              <li><a href="/login" className="text-gray-400 hover:text-amber-400 transition">Sign In</a></li>
              <li><a href="/register" className="text-gray-400 hover:text-amber-400 transition">Get Started</a></li>
              <li><a href="/" className="text-gray-400 hover:text-amber-400 transition">Dashboard</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Help Center</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Contact Us</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">FAQ</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Report Issue</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Feedback</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Privacy Policy</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Terms of Service</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Security</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Cookie Policy</button></li>
              <li><button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0">Disclaimer</button></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-amber-400/10 to-orange-500/10 rounded-lg p-8 mb-12 border border-amber-400/20">
          <h4 className="text-xl font-bold text-white mb-4">Stay Updated</h4>
          <p className="text-gray-400 mb-4">Subscribe to our newsletter for auction alerts and platform updates.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow relative">
              <input
                type="email"
                id="footer-email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400 text-white placeholder-gray-500 transition-all"
              />
            </div>
            <button 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const emailInput = document.getElementById('footer-email');
                const email = emailInput.value;
                if (!email) return;
                
                btn.disabled = true;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="flex items-center gap-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent"></div> Syncing...</span>';
                
                try {
                  const response = await fetch('http://localhost:3001/api/auth/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                  });
                  const data = await response.json();
                  
                  if (data.success) {
                    btn.innerHTML = '✓ Subscribed';
                    btn.classList.replace('from-amber-400', 'from-emerald-500');
                    btn.classList.replace('to-orange-500', 'to-emerald-600');
                    emailInput.value = '';
                  } else {
                    throw new Error(data.error);
                  }
                } catch (err) {
                  btn.innerHTML = 'Error';
                  btn.classList.replace('from-amber-400', 'from-red-500');
                  btn.classList.replace('to-orange-500', 'to-red-600');
                  setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.classList.replace('from-red-500', 'from-amber-400');
                    btn.classList.replace('to-red-600', 'to-orange-500');
                  }, 3000);
                }
              }}
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-black px-8 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-amber-500/10 uppercase tracking-widest text-xs min-w-[140px]"
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mb-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            <p>&copy; {currentYear} V.I.B.E - Validated Intelligent Bidding Engine. All rights reserved.</p>
            <p className="mt-1">Developed as a Final Year Project at Air University Islamabad</p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0" title="Facebook" aria-label="Visit Facebook">
              <FiFacebook size={20} />
            </button>
            <button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0" title="Twitter" aria-label="Visit Twitter">
              <FiTwitter size={20} />
            </button>
            <button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0" title="LinkedIn" aria-label="Visit LinkedIn">
              <FiLinkedin size={20} />
            </button>
            <button className="text-gray-400 hover:text-amber-400 transition bg-none border-none cursor-pointer p-0" title="Instagram" aria-label="Visit Instagram">
              <FiInstagram size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-slate-950 border-t border-slate-700 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-gray-500">
            <div>🔒 SSL Encrypted</div>
            <div>✓ 99.9% Uptime</div>
            <div>🛡️ Fraud Detection</div>
            <div>⚡ Real-Time Updates</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
