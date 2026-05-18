import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError, googleLoginUser } from '../redux/slices/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiShoppingCart, FiTrendingUp, FiShield } from 'react-icons/fi';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer'
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

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

    const result = await dispatch(registerUser({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role
    }));
    
    if (registerUser.fulfilled.match(result)) {
      // Show success briefly
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right duration-500 font-bold';
      successDiv.innerText = '✓ Account Created! Redirecting...';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
        navigate('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white border-b border-slate-700">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">V.I.B.E</h1>
            <p className="text-gray-400 text-sm">Validated Intelligent Bidding Engine</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400 text-sm mb-6">Join V.I.B.E and start bidding</p>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition bg-slate-700 text-white placeholder-gray-500 ${
                      validationErrors.username
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-600 focus:ring-amber-400'
                    }`}
                    placeholder="johndoe"
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition bg-slate-700 text-white placeholder-gray-500 ${
                      validationErrors.email
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-600 focus:ring-amber-400'
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

              {/* Account Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">Account Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Buyer Option */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'buyer' }))}
                    className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      formData.role === 'buyer'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <FiShoppingCart className={formData.role === 'buyer' ? 'text-amber-400' : 'text-gray-400'} size={20} />
                    <span className={`text-[11px] font-bold ${formData.role === 'buyer' ? 'text-amber-400' : 'text-gray-300'}`}>
                      Buyer
                    </span>
                  </button>

                  {/* Seller Option */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'seller' }))}
                    className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      formData.role === 'seller'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <FiTrendingUp className={formData.role === 'seller' ? 'text-amber-400' : 'text-gray-400'} size={20} />
                    <span className={`text-[11px] font-bold ${formData.role === 'seller' ? 'text-amber-400' : 'text-gray-300'}`}>
                      Seller
                    </span>
                  </button>

                  {/* Admin Option */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                    className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                      formData.role === 'admin'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <FiShield className={formData.role === 'admin' ? 'text-amber-400' : 'text-gray-400'} size={20} />
                    <span className={`text-[11px] font-bold ${formData.role === 'admin' ? 'text-amber-400' : 'text-gray-300'}`}>
                      Admin
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition bg-slate-700 text-white placeholder-gray-500 ${
                      validationErrors.password
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-600 focus:ring-amber-400'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-grow bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength < 40
                              ? 'bg-red-500'
                              : passwordStrength < 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-400">
                        {passwordStrength < 40
                          ? 'Weak'
                          : passwordStrength < 70
                          ? 'Medium'
                          : 'Strong'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Use uppercase, numbers, and special characters</p>
                  </div>
                )}

                {validationErrors.password && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition bg-slate-700 text-white placeholder-gray-500 ${
                      validationErrors.confirmPassword
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-600 focus:ring-amber-400'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200 flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={18} />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-gray-400">or</span>
              </div>
            </div>
            {/* Google Register */}
            <div className="flex justify-center mb-4">
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
                      alert(result.payload || 'Google sign-up failed. Please try again.');
                    }
                  }
                }}
                onError={() => {
                  console.log('Google Sign-Up Failed');
                }}
                useOneTap={false}
                theme="filled_black"
                shape="rectangular"
                text="signup_with"
                width="100%"
              />
            </div>

            {/* Sign In Link */}
            <p className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default Register;
