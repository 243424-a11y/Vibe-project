import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { bidAPI, auctionAPI } from '../services/api';
import {
  FiLogOut, FiEdit, FiCheck, FiX, FiTrendingUp, FiClock,
  FiPlus, FiPackage, FiDollarSign, FiStar, FiUser, FiShield,
  FiSave, FiTrash2
} from 'react-icons/fi';

const statusColors = {
  winning: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  sold: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  useEffect(() => { if (isAdmin) navigate('/admin', { replace: true }); }, [isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState(isSeller ? 'listings' : 'bids');
  const [bids, setBids] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = user?.user_id || user?.id;
        if (!userId) return;
        if (!isSeller) {
          const bidsRes = await bidAPI.getUserBids();
          setBids(bidsRes.data.data || []);
        } else {
          const listingsRes = await auctionAPI.getAll({ sellerId: userId, status: '' });
          setListings(listingsRes.data.data || []);
        }
      } catch (err) { console.error('Dashboard load error', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, isSeller]);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const startEdit = (item) => {
    setEditingId(item.auction_id);
    setEditData({
      title: item.title,
      description: item.description,
      starting_price: item.starting_price,
    });
    setEditMsg('');
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); setEditMsg(''); };

  const saveEdit = async (auctionId) => {
    setEditLoading(true);
    try {
      await auctionAPI.update(auctionId, {
        title: editData.title,
        description: editData.description,
        startingPrice: parseFloat(editData.starting_price)
      });
      setListings(prev => prev.map(l => l.auction_id === auctionId ? { ...l, ...editData } : l));
      setEditMsg('✓ Saved');
      setTimeout(() => { setEditingId(null); setEditMsg(''); }, 1200);
    } catch (err) {
      setEditMsg(err.response?.data?.error || 'Update failed');
    } finally { setEditLoading(false); }
  };

  const handleDelete = async (auctionId) => {
    if (!window.confirm('Delete this auction?')) return;
    try {
      await auctionAPI.delete(auctionId);
      setListings(prev => prev.filter(l => l.auction_id !== auctionId));
    } catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  const tabs = isSeller
    ? [{ id: 'listings', label: 'My Listings', icon: FiPackage, count: listings.length }, { id: 'profile', label: 'Profile', icon: FiUser }]
    : [{ id: 'bids', label: 'My Bids', icon: FiTrendingUp, count: bids.length }, { id: 'profile', label: 'Profile', icon: FiUser }];

  const stats = isSeller
    ? [{ label: 'Active', value: listings.filter(l => l.status === 'active').length, color: 'text-emerald-400' },
       { label: 'Total', value: listings.length, color: 'text-amber-400' },
       { label: 'Sold', value: listings.filter(l => l.status === 'sold').length, color: 'text-blue-400' }]
    : [{ label: 'Active Bids', value: bids.length, color: 'text-amber-400' },
       { label: 'Total Spent', value: `$${bids.reduce((s, b) => s + parseFloat(b.bid_amount || 0), 0).toLocaleString()}`, color: 'text-emerald-400' }];

  return (
    <div className="min-h-screen bg-mesh bg-dark-900 py-8 px-4 animate-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-glow">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center text-slate-900 font-black text-3xl shadow-2xl shadow-primary/20 rotate-3">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                {isSeller ? 'Seller Hub' : 'My Collection'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">{user?.role}</span>
                <span className="text-gray-400 text-sm flex items-center gap-1"><FiStar className="text-primary fill-primary" size={14}/> Verified</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isSeller && <Link to="/create-auction" className="btn-premium flex items-center gap-2"><FiPlus size={20}/> New Auction</Link>}
            <button onClick={handleLogout} className="btn-glass flex items-center gap-2 text-red-400 border-red-500/20 hover:bg-red-500/10"><FiLogOut size={18}/> Exit</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {stats.map((s, idx) => (
            <div key={s.label} className="glass-card p-6 border-glow" style={{ animationDelay: `${idx * 0.1}s` }}>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-4xl font-black ${s.color} text-glow`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
                    active ? 'bg-primary text-dark-900 shadow-lg shadow-primary/20 scale-105' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}>
                  <div className="flex items-center gap-3"><Icon size={20}/>{tab.label}</div>
                  {tab.count !== undefined && <span className={`text-xs px-2 py-1 rounded-lg ${active ? 'bg-dark-900/20' : 'bg-dark-800'}`}>{tab.count}</span>}
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-9">
            <div className="glass-panel p-8 min-h-[500px]">
              {/* Bids Tab */}
              {activeTab === 'bids' && (
                <div className="animate-in">
                  <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><FiTrendingUp className="text-primary"/> Active Participations</h2>
                  {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"/></div>
                  ) : bids.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <FiDollarSign className="mx-auto text-gray-600 mb-4" size={48}/>
                      <p className="text-gray-400 font-bold">No active bids found.</p>
                      <Link to="/auctions" className="text-primary mt-2 inline-block hover:underline">Browse auctions →</Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {bids.map(bid => (
                        <div key={bid.bid_id} className="glass-card p-6 flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-dark-800 rounded-xl flex items-center justify-center text-primary font-bold border border-white/5">BID</div>
                            <div>
                              <Link to={`/auction/${bid.auction_id}`} className="text-xl font-bold text-white hover:text-primary transition">
                                {bid.title || `Auction #${bid.auction_id}`}
                              </Link>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-gray-500 text-xs flex items-center gap-1 uppercase font-bold">
                                  <FiClock size={12}/> {new Date(bid.bid_time || bid.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Your Bid</p>
                            <p className="text-3xl font-black text-primary text-glow">${parseFloat(bid.bid_amount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Listings Tab (Seller) */}
              {activeTab === 'listings' && (
                <div className="animate-in">
                  <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><FiPackage className="text-primary"/> Inventory Management</h2>
                  {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"/></div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <FiPackage className="mx-auto text-gray-600 mb-4" size={48}/>
                      <p className="text-gray-400 font-bold">Your inventory is empty.</p>
                      <Link to="/create-auction" className="btn-premium mt-6 inline-block">List Your First Item</Link>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {listings.map(item => (
                        <div key={item.auction_id} className="glass-card overflow-hidden group">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-48 h-48 relative overflow-hidden">
                              <img src={item.primary_image_url || 'https://images.unsplash.com/photo-1588626601614-22b07e7b6401?w=300&q=60'} alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                              <div className="absolute top-2 left-2">
                                <span className={`badge-premium ${statusColors[item.status] || statusColors.pending}`}>{item.status}</span>
                              </div>
                            </div>
                            <div className="flex-1 p-6 flex flex-col justify-between">
                              {editingId === item.auction_id ? (
                                /* EDIT MODE */
                                <div className="space-y-4">
                                  <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})}
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"/>
                                  <textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={2}
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"/>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500 text-xs font-bold">Price: $</span>
                                      <input type="number" value={editData.starting_price} onChange={e => setEditData({...editData, starting_price: e.target.value})}
                                        className="w-32 bg-dark-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"/>
                                    </div>
                                    <button onClick={() => saveEdit(item.auction_id)} disabled={editLoading}
                                      className="flex items-center gap-1 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black uppercase hover:bg-emerald-500/30 transition disabled:opacity-50">
                                      <FiSave size={14}/> {editLoading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button onClick={cancelEdit} className="flex items-center gap-1 px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-xs font-black uppercase hover:bg-white/10 transition">
                                      <FiX size={14}/> Cancel
                                    </button>
                                  </div>
                                  {editMsg && <p className={`text-xs font-bold ${editMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{editMsg}</p>}
                                </div>
                              ) : (
                                /* VIEW MODE */
                                <>
                                  <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition">{item.title}</h3>
                                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{item.description}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-6">
                                    <div className="flex items-center gap-6">
                                      <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base Price</p>
                                        <p className="text-lg font-bold text-white">${parseFloat(item.starting_price).toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Bid</p>
                                        <p className="text-lg font-bold text-primary">${parseFloat(item.current_price).toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bids</p>
                                        <p className="text-lg font-bold text-white">{item.bid_count || 0}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => startEdit(item)} title="Edit auction"
                                        className="p-2 bg-white/5 rounded-lg text-gray-400 hover:bg-primary/20 hover:text-primary transition">
                                        <FiEdit size={18}/>
                                      </button>
                                      <button onClick={() => handleDelete(item.auction_id)} title="Delete auction"
                                        className="p-2 bg-white/5 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition">
                                        <FiTrash2 size={18}/>
                                      </button>
                                      <Link to={`/auction/${item.auction_id}`} className="p-2 bg-primary/20 rounded-lg text-primary hover:bg-primary/30 transition">
                                        <FiTrendingUp size={18}/>
                                      </Link>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="animate-in">
                  <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><FiUser className="text-primary"/> Profile Settings</h2>
                  <div className="glass-card p-8 border-glow space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
                        <input type="text" readOnly value={user?.username} className="glass-input w-full mt-2 cursor-not-allowed opacity-70"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                        <input type="text" readOnly value={user?.email} className="glass-input w-full mt-2 cursor-not-allowed opacity-70"/>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <FiShield className="text-emerald-400" size={24}/>
                        <div>
                          <p className="text-white font-bold">Account Security</p>
                          <p className="text-gray-500 text-xs">Your account is protected with JWT authentication.</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 text-xs font-black uppercase">Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
