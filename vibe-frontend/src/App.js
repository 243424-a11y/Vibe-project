import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Pages
import Home from './pages/Home';
import AuctionListing from './pages/AuctionListing';
import AuctionDetail from './pages/AuctionDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CreateAuction from './pages/CreateAuction';
import CartPage from './pages/CartPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Redux
import { verifyAuth } from './redux/slices/authSlice';

// Role-based protected route
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

// Redirect authenticated users away from auth pages
function GuestRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-3xl font-black text-slate-900">V</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auctions" element={<AuctionListing />} />
            <Route path="/auction/:id" element={<AuctionDetail />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Guest-only Routes */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Buyer / Seller Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Seller-only: Create Auction */}
            <Route path="/create-auction" element={
              <ProtectedRoute requiredRole="seller">
                <CreateAuction />
              </ProtectedRoute>
            } />

            {/* Admin-only: Admin Panel */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
