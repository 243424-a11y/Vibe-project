import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleLoginUser, clearError } from '../redux/slices/authSlice';
import { FiMail, FiLock, FiAlertCircle, FiCheck, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({ email: '', password: '', role: 'buyer' });
  const [validationErrors, setValidationErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const cleanFormData = { ...formData, email: formData.email.trim().toLowerCase() };
    console.log('Attempting login with:', cleanFormData);
    const result = await dispatch(loginUser(cleanFormData));
    console.log('Login result:', result);
    
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload;
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Dynamic redirection based on role
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 animate-in fade-in zoom-in duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white border-b border-slate-700">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2 tracking-tighter">V.I.B.E</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-80">Validated Intelligent Bidding Engine</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-bounce-subtle">
                <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Account Type Selection (UPDATED) */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Login As</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Buyer Option */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'buyer' }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                      formData.role === 'buyer'
                        ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      formData.role === 'buyer' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-gray-400 group-hover:text-gray-300'
                    }`}>
                      <FiShoppingCart size={16} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.role === 'buyer' ? 'text-amber-400' : 'text-gray-400'}`}>
                      Buyer
                    </span>
                  </button>

                  {/* Seller Option */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'seller' }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                      formData.role === 'seller'
                        ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      formData.role === 'seller' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-gray-400 group-hover:text-gray-300'
                    }`}>
                      <FiTrendingUp size={16} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.role === 'seller' ? 'text-amber-400' : 'text-gray-400'}`}>
                      Seller
                    </span>
                  </button>

                  {/* Admin Option */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
                      formData.role === 'admin'
                        ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      formData.role === 'admin' ? 'bg-orange-500 text-slate-900' : 'bg-slate-700 text-gray-400 group-hover:text-gray-300'
                    }`}>
                      <FiLock size={16} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.role === 'admin' ? 'text-orange-500' : 'text-gray-400'}`}>
                      Admin
                    </span>
                  </button>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition bg-slate-900/50 text-white placeholder-gray-600 ${
                      validationErrors.email
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-amber-400'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" size="xs" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition bg-slate-900/50 text-white placeholder-gray-600 ${
                      validationErrors.password
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-700 focus:ring-amber-400'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border transition-all duration-300 flex items-center justify-center ${
                    rememberMe ? 'bg-amber-400 border-amber-400' : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'
                  }`}>
                    {rememberMe && <FiCheck size={14} className="text-slate-900" />}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 rounded-xl font-black text-slate-900 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-lg ${
                  loading
                    ? 'bg-slate-700 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={18} />
                    <span>Access Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="px-4 bg-[#1e293b] text-gray-500">Secure Entry</span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center mb-8">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse?.credential) {
                    const result = await dispatch(googleLoginUser({
                      credential: credentialResponse.credential,
                      role: formData.role
                    }));

                    if (googleLoginUser.fulfilled.match(result)) {
                      const user = result.payload;
                      if (user.role === 'admin') {
                        navigate('/admin', { replace: true });
                      } else {
                        navigate('/dashboard', { replace: true });
                      }
                    } else if (googleLoginUser.rejected.match(result)) {
                      alert(result.payload || 'Google sign-in failed. Please try again.');
                    }
                  }
                }}
                onError={() => {
                  console.log('Google Login Failed');
                }}
                useOneTap={false}
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
                width="100%"
              />
            </div>

            {/* Demo Shortcut */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'mehtab1234@gmail.com', password: 'password123', role: 'admin' });
                }}
                className="w-full py-3 px-4 rounded-xl border border-amber-400/30 bg-amber-400/5 text-amber-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-amber-400/10 transition-all hover:scale-[1.01]"
              >
                Sample Admin Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'mehtabkhanmks784@gmail.com', password: 'password123', role: 'buyer' });
                }}
                className="w-full py-3 px-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-400/10 transition-all hover:scale-[1.01]"
              >
                Sample Buyer Profile
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-gray-500 text-sm font-medium mt-6">
              New to the platform?{' '}
              <Link to="/register" className="text-amber-400 hover:text-amber-300 font-black underline-offset-4 hover:underline transition-all">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-[10px] uppercase font-bold tracking-[0.2em] mt-8 opacity-50">
          Encrypted Authentication System v2.4.0
        </p>
      </div>
    </div>
  );
}

export default Login;
