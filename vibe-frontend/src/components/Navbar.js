import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { markAllRead } from '../redux/slices/notificationSlice';
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiSettings,
  FiPlus, FiTrendingUp, FiHome, FiGrid, FiShield, FiCheck
} from 'react-icons/fi';
import { FiShoppingCart } from 'react-icons/fi';
import { fetchCartCount } from '../redux/slices/cartSlice';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items: notifications, unreadCount } = useSelector(state => state.notifications);
  const cartCount = useSelector(state => state.cart?.count || 0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  // Fetch cart count on auth change
  useEffect(() => {
    if (!user || user?.role === 'buyer') {
      dispatch(fetchCartCount());
    }
  }, [dispatch, isAuthenticated, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    setIsProfileOpen(false);
    if (!isNotifOpen) dispatch(markAllRead());
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label, Icon) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition duration-200 text-sm
        ${isActive(to)
          ? 'bg-amber-400/15 text-amber-400'
          : 'text-gray-300 hover:text-amber-300 hover:bg-slate-800'}`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </Link>
  );

  const notifIcon = { bid: '💰', auction: '🔨', outbid: '⚠️', fraud: '🛡️', payment: '💳', seller: '📦' };

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-2xl sticky top-0 z-50 border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg group-hover:scale-105 transition">
                <span className="text-xl font-black text-slate-900">V</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 leading-none">
                  V.I.B.E
                </h1>
                <p className="text-xs text-amber-400/70 font-semibold tracking-widest">AUCTIONS</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLink('/', 'Home', FiHome)}
              {navLink('/auctions', 'Browse', FiGrid)}

              {isAuthenticated && !isAdmin && navLink('/dashboard', 'Dashboard', FiUser)}
              {isAuthenticated && isAdmin && navLink('/admin', 'Admin Panel', FiShield)}
              {isAuthenticated && isSeller && (
                <Link
                  to="/create-auction"
                  className="ml-1 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold px-4 py-2 rounded-lg transition text-sm shadow-lg"
                >
                  <FiPlus size={16} />
                  Create Auction
                </Link>
              )}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={handleOpenNotif}
                      className="relative p-2 rounded-lg hover:bg-slate-800 text-gray-300 hover:text-amber-300 transition"
                      title="Notifications"
                    >
                      <FiBell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                          <h3 className="text-white font-bold">Notifications</h3>
                          <span className="text-xs text-amber-400">{notifications.filter(n => !n.read).length} unread</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-6">No notifications</p>
                          ) : (
                            notifications.slice(0, 8).map(notif => (
                              <div
                                key={notif.id}
                                className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 transition ${!notif.read ? 'bg-amber-400/5' : ''}`}
                              >
                                <div className="flex gap-3 items-start">
                                  <span className="text-xl flex-shrink-0">{notifIcon[notif.type] || '🔔'}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold ${notif.read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                                  </div>
                                  {!notif.read && <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1" />}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-slate-700 flex justify-center">
                          <Link to="/dashboard" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                            View all in Dashboard →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cart Icon (buyers only or unauthenticated) */}
                  {( !user || user?.role === 'buyer' ) && (
                    <button onClick={() => navigate('/cart')} className="relative p-2 rounded-lg hover:bg-slate-800 text-gray-300 hover:text-amber-300 transition" title="Cart">
                      <FiShoppingCart size={20} />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {cartCount > 9 ? '9+' : cartCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm shadow">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-gray-200 font-semibold text-sm leading-none">{user?.username}</span>
                        <span className="text-xs text-amber-400 capitalize leading-none mt-0.5">{user?.role}</span>
                      </div>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl py-2 z-50 border border-slate-700">
                        <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-white font-semibold text-sm">{user?.username}</p>
                          <p className="text-xs text-amber-400 capitalize mt-0.5">{user?.role} Account</p>
                        </div>
                        {!isAdmin && (
                          <Link to="/dashboard" onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-200 hover:bg-slate-700 transition text-sm">
                            <FiUser size={16} /> My Profile
                          </Link>
                        )}
                        {isSeller && (
                          <Link to="/create-auction" onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-200 hover:bg-slate-700 transition text-sm">
                            <FiPlus size={16} /> Create Auction
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-200 hover:bg-slate-700 transition text-sm">
                            <FiShield size={16} /> Admin Panel
                          </Link>
                        )}
                        <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-gray-200 hover:bg-slate-700 transition text-sm">
                          <FiSettings size={16} /> Settings
                        </Link>
                        <div className="border-t border-slate-700 mt-1">
                          <button onClick={handleLogout}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-700 transition text-sm">
                            <FiLogOut size={16} /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-amber-300 font-medium transition px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold px-4 py-2 rounded-lg transition text-sm shadow-lg">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition">
              {isMenuOpen ? <FiX size={24} className="text-gray-200" /> : <FiMenu size={24} className="text-gray-200" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-800/95 backdrop-blur-sm border-t border-slate-700">
            <div className="px-4 py-4 space-y-1">
              <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-slate-700 rounded-lg transition font-medium text-sm">
                <FiHome size={18} /> Home
              </Link>
              <Link to="/auctions" className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-slate-700 rounded-lg transition font-medium text-sm">
                <FiGrid size={18} /> Browse Auctions
              </Link>
              {isAuthenticated ? (
                <>
                  {!isAdmin && (
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-slate-700 rounded-lg transition font-medium text-sm">
                      <FiUser size={18} /> Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-slate-700 rounded-lg transition font-medium text-sm">
                      <FiShield size={18} /> Admin Panel
                    </Link>
                  )}
                  {isSeller && (
                    <Link to="/create-auction" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-lg transition text-sm">
                      <FiPlus size={18} /> Create Auction
                    </Link>
                  )}
                  <div className="border-t border-slate-700 pt-2 mt-2">
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700 rounded-lg transition font-medium text-sm">
                      <FiLogOut size={18} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex px-4 py-3 text-gray-200 hover:bg-slate-700 rounded-lg transition font-medium text-sm">Sign In</Link>
                  <Link to="/register" className="flex px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-lg transition text-sm">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;
