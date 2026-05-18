import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../hooks/useSocket';
import { fetchAuctionById, toggleLike } from '../redux/slices/auctionSlice';
import { fetchAuctionBids, placeBid } from '../redux/slices/bidSlice';
import { addToCart, removeFromCart, fetchCartCount } from '../redux/slices/cartSlice';
import { auctionAPI, cartAPI } from '../services/api';
import {
  FiChevronLeft, FiChevronRight, FiClock, FiStar,
  FiTrendingUp, FiAlertCircle, FiCheck, FiZap, FiEye,
  FiHeart, FiShare2, FiShield, FiActivity, FiPackage,
  FiDollarSign, FiCheckCircle, FiArrowRight, FiCreditCard, FiLock
} from 'react-icons/fi';
import { addBid } from '../redux/slices/bidSlice';

function useCountdown(endTime) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, ended: false, urgent: false });
  useEffect(() => {
    if (!endTime) return;
    const calc = () => {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0, ended: true, urgent: false }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s, ended: false, urgent: diff < 3600000 });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return time;
}

export default function AuctionDetail() {
  const { id: auctionId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { selectedAuction: auction, loading: auctionLoading } = useSelector(state => state.auction);
  const { bids, loading: bidsLoading } = useSelector(state => state.bid);
  
  const isBuyer = user?.role === 'buyer' || !user?.role;
  const isAdmin = user?.role === 'admin';
  const { socket, joinRoom, leaveRoom, onBidUpdate, offBidUpdate } = useSocket();

  const [imgIdx, setImgIdx] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [bidFlash, setBidFlash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const [recommendedBid, setRecommendedBid] = useState(null);
  const [showTransaction, setShowTransaction] = useState(false);
  const [txStep, setTxStep] = useState(1); // 1: prompt, 2: card, 3: success
  const [txLoading, setTxLoading] = useState(false);

  // New states for real-time likes
  const [localLikes, setLocalLikes] = useState(auction?.likes_count || 0);
  const [localIsLiked, setLocalIsLiked] = useState(auction?.is_liked || false);

  useEffect(() => {
    dispatch(fetchAuctionById(auctionId));
    dispatch(fetchAuctionBids(auctionId));
    // Fetch recommended bid
    auctionAPI.getRecommendedBid(auctionId)
      .then(res => setRecommendedBid(res.data.data?.recommended_bid))
      .catch(() => {});

    // check cart membership after auction loads
    (async () => {
      try {
        const res = await cartAPI.getCart();
        const list = res.data.data || [];
        const found = list.some(i => parseInt(i.auction_id) === parseInt(auctionId));
        setInCart(found);
      } catch (err) {
        // ignore
      }
    })();
  }, [dispatch, auctionId]);

  useEffect(() => {
    if (auction) {
      setLocalLikes(auction.likes_count || 0);
      setLocalIsLiked(auction.is_liked || false);
    }
  }, [auction]);

  useEffect(() => {
    joinRoom(auctionId);
    
    const handleBid = (data) => {
      dispatch(addBid(data));
      setBidFlash(true);
      setTimeout(() => setBidFlash(false), 1500);
    };

    // Socket listener for real-time likes
    const handleLikeUpdate = (data) => {
      setLocalLikes(data.count);
    };

    const handleStatusUpdate = (data) => {
      if (data.auctionId === parseInt(auctionId)) {
        dispatch(fetchAuctionById(auctionId));
      }
    };

    onBidUpdate(handleBid);
    
    if (socket) {
      socket.on(`auction:${auctionId}:like`, handleLikeUpdate);
      socket.on('auctionStatusUpdate', handleStatusUpdate);
    }

    return () => { 
      leaveRoom(auctionId); 
      offBidUpdate(handleBid);
      if (socket) {
        socket.off(`auction:${auctionId}:like`, handleLikeUpdate);
        socket.off('auctionStatusUpdate', handleStatusUpdate);
      }
    };
  }, [auctionId, joinRoom, leaveRoom, onBidUpdate, offBidUpdate, socket]);

  const timer = useCountdown(auction?.endTime || auction?.end_time);

  const showMsg = (type, text) => { 
    setMsg({ type, text }); 
    setTimeout(() => setMsg({ type: '', text: '' }), 3500); 
  };

  // pad function for timer
  const pad = (num) => String(num).padStart(2, '0');

  useEffect(() => {
    if (timer.ended && auction?.status === 'active') {
      // Small delay to allow server jobs to run
      setTimeout(() => {
        dispatch(fetchAuctionById(auctionId));
      }, 2000);
    }
  }, [timer.ended, auction?.status, auctionId, dispatch]);

  const handleLike = async () => {
    if (!isAuthenticated) { showMsg('error', 'Sign in to like this auction'); return; }
    try {
      // Optimistic UI update
      setLocalIsLiked(!localIsLiked);
      setLocalLikes(prev => localIsLiked ? prev - 1 : prev + 1);
      
      await dispatch(toggleLike(auctionId)).unwrap();
    } catch (err) {
      // Revert on error
      setLocalIsLiked(localIsLiked);
      setLocalLikes(localLikes);
      showMsg('error', 'Failed to update like');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareTooltip(true);
    setTimeout(() => setShareTooltip(false), 2000);
    showMsg('success', 'Link copied to clipboard!');
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) { showMsg('error', 'Sign in to subscribe'); return; }
    setIsSubmitting(true);
    try {
      await auctionAPI.subscribe(auctionId, user.email);
      showMsg('success', '✓ You are now subscribed to real-time updates!');
    } catch (err) {
      showMsg('error', 'Subscription failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { showMsg('error', 'Please sign in to place a bid'); return; }
    if (!isBuyer) { showMsg('error', 'Only buyers can place bids'); return; }
    
    const amt = parseFloat(bidAmount);
    
    // Robust local price calculation
    const getLatestBidAmountLocal = () => {
      if (!bids || bids.length === 0) return null;
      const first = bids[0];
      const val = first.bid_amount ?? first.amount ?? first.bidAmount ?? null;
      return val !== null ? parseFloat(val) : null;
    };
    const startPriceLocal = parseFloat(auction.startPrice ?? auction.starting_price ?? auction.startingPrice ?? 0);
    const currentPriceLocal = (getLatestBidAmountLocal() ?? parseFloat(auction.current_price ?? auction.currentPrice ?? startPriceLocal)) || startPriceLocal || 0;
    
    if (!amt || amt <= currentPriceLocal) { 
      showMsg('error', `Bid must be higher than $${currentPriceLocal.toLocaleString()}`); 
      return; 
    }
    
    try {
      await dispatch(placeBid({ auctionId, amount: amt })).unwrap();
      showMsg('success', `✓ Bid of $${amt.toLocaleString()} authenticated successfully!`);
      setBidAmount('');
      // Show professional transaction modal immediately
      setTxStep(1);
      setShowTransaction(true);
    } catch (err) {
      showMsg('error', err || 'Failed to place bid');
    }
  };

  const handleFinalize = async (action) => {
    if (action === 'buy') {
      setTxStep(2);
      return;
    }
    
    // If the auction has not ended yet, "leave" just means closing the modal
    if (!timer.ended && auction.status !== 'completed') {
      setShowTransaction(false);
      showMsg('success', 'Your bid is active. Other buyers can now compete!');
      return;
    }

    setTxLoading(true);
    try {
      await auctionAPI.finalizeAuction(auctionId, 'leave');
      showMsg('success', 'Auction reactivated successfully for other buyers.');
      dispatch(fetchAuctionById(auctionId));
    } catch (err) {
      showMsg('error', 'Failed to reactivate auction');
    } finally {
      setTxLoading(false);
      setShowTransaction(false);
    }
  };

  const processPayment = async () => {
    setTxLoading(true);
    // Simulated payment delay
    setTimeout(async () => {
      try {
        await auctionAPI.finalizeAuction(auctionId, 'buy');
        setTxStep(3);
        dispatch(fetchAuctionById(auctionId));
      } catch (err) {
        showMsg('error', 'Payment failed. Please try again.');
        setTxStep(1);
      } finally {
        setTxLoading(false);
      }
    }, 2000);
  };

  // pad is already declared above

  if (auctionLoading || !auction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-amber-400 bg-slate-900">
        <FiActivity className="animate-spin" size={40} />
      </div>
    );
  }

  // Robust price extraction to prevent any NaN display
  const getLatestBidAmount = () => {
    if (!bids || bids.length === 0) return null;
    const first = bids[0];
    const val = first.bid_amount ?? first.amount ?? first.bidAmount ?? null;
    return val !== null ? parseFloat(val) : null;
  };

  const startPrice = parseFloat(auction.startPrice ?? auction.starting_price ?? auction.startingPrice ?? 0);
  const currentPrice = (getLatestBidAmount() ?? parseFloat(auction.current_price ?? auction.currentPrice ?? startPrice)) || startPrice || 0;
  let images = ['https://images.unsplash.com/photo-1588626601614-22b07e7b6401?w=800&q=80'];
  if (auction.primary_image_url) {
    images = [auction.primary_image_url, ...(auction.additional_images || [])];
  } else if (auction.images) {
    images = JSON.parse(auction.images);
  }

  return (
    <div className="min-h-screen bg-mesh bg-dark-900 py-8 px-4 font-sans selection:bg-primary/30">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-8 animate-in fade-in slide-in-from-left duration-500">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <FiChevronRight size={10} />
          <Link to="/auctions" className="hover:text-primary transition-colors">Marketplace</Link>
          <FiChevronRight size={10} />
          <span className="text-white truncate max-w-xs">{auction.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: Images + Details */}
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
            {/* Image Gallery */}
            <div className="glass-panel overflow-hidden border-glow">
              <div className="relative aspect-video overflow-hidden bg-dark-800">
                <img src={images[imgIdx]} alt={auction.title} className="w-full h-full object-cover transition duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />
                
                {/* Image Nav */}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => i === 0 ? images.length - 1 : i - 1)}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-dark-900/50 hover:bg-primary text-white hover:text-dark-900 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/10">
                      <FiChevronLeft size={24} />
                    </button>
                    <button onClick={() => setImgIdx(i => i === images.length - 1 ? 0 : i + 1)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-dark-900/50 hover:bg-primary text-white hover:text-dark-900 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/10">
                      <FiChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-6 right-6 bg-dark-900/80 text-white text-[10px] font-black px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest">
                      {imgIdx + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 p-4 bg-dark-900/50 backdrop-blur-sm border-t border-white/5">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${i === imgIdx ? 'border-primary scale-105 shadow-lg shadow-primary/20' : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/20'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Details Section */}
            <div className="glass-panel p-8 border-glow">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                      {auction.category || 'General'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <FiEye size={12} /> {auction.views_count || 0} Views
                    </span>
                  </div>
                  <h1 className="text-4xl font-black text-white leading-tight tracking-tight">{auction.title}</h1>
                </div>

                {/* Interaction Buttons (REAL-TIME) */}
                <div className="flex gap-3 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <button onClick={handleLike}
                      className={`w-12 h-12 rounded-2xl border transition-all duration-300 flex items-center justify-center group ${
                        localIsLiked 
                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-400 hover:text-red-400'
                      }`}>
                      <FiHeart size={20} className={`transition-all duration-300 ${localIsLiked ? 'fill-white scale-110' : 'group-hover:scale-110'}`} />
                    </button>
                    <span className={`text-[10px] font-black mt-1.5 transition-colors ${localIsLiked ? 'text-red-400' : 'text-gray-500'}`}>
                      {localLikes}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={handleShare}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center group">
                      <FiShare2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="text-[10px] font-black mt-1.5 text-gray-500 uppercase tracking-widest">Share</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={handleSubscribe} disabled={isSubmitting}
                      className={`w-12 h-12 rounded-2xl border transition-all duration-300 flex items-center justify-center group ${
                        isSubmitting ? 'bg-slate-700 border-slate-600' : 'bg-white/5 border-white/10 text-gray-400 hover:border-emerald-400 hover:text-emerald-400'
                      }`}>
                      {isSubmitting ? <FiActivity className="animate-spin" size={20} /> : <FiStar size={20} className="group-hover:scale-110 transition-transform" />}
                    </button>
                    <span className="text-[10px] font-black mt-1.5 text-gray-500 uppercase tracking-widest">Alerts</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[{ label: 'Condition', value: auction.condition || 'Brand New', icon: FiPackage }, 
                  { label: 'Status', value: auction.status, icon: FiActivity }, 
                  { label: 'Starting Price', value: `$${startPrice.toLocaleString()}`, icon: FiDollarSign },
                  { label: 'Total Bids', value: bids.length, icon: FiTrendingUp }].map(f => (
                  <div key={f.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors duration-300">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                      <f.icon size={10} className="text-primary" /> {f.label}
                    </p>
                    <p className="text-white font-bold text-sm tracking-tight">{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Product Specification</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-medium">{auction.description}</p>
              </div>

              {/* AI Shield Notice */}
              <div className="mt-8 flex items-center gap-4 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-500/10 transition-colors duration-500">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                  <FiShield size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-0.5">Validated Security</p>
                  <p className="text-[11px] text-emerald-500/80 font-bold">V.I.B.E Engine is monitoring this auction for suspicious bidding patterns and fraud.</p>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="glass-panel p-8 border-glow">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <FiActivity size={18} />
                </div>
                Live Bid Log
                <span className="text-xs text-gray-500 font-bold ml-auto tracking-widest">{bids.length} ACTIVE BIDS</span>
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {bids.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <FiTrendingUp className="mx-auto text-gray-700" size={32} />
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">The floor is open. No bids yet.</p>
                  </div>
                ) : (
                  bids.map((bid, i) => (
                    <div key={bid.id || i} 
                      className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 border ${
                        i === 0 
                        ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                          i === 0 ? 'bg-primary text-dark-900' : 'bg-dark-800 text-gray-500'
                        }`}>
                          {(bid.username || bid.bidder || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm uppercase tracking-tight">{bid.username || bid.bidder || 'Premium User'}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {bid.created_at || bid.createdAt ? new Date(bid.created_at || bid.createdAt).toLocaleTimeString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xl tracking-tighter ${i === 0 ? 'text-primary' : 'text-white'}`}>
                          ${parseFloat(bid.bid_amount || bid.amount || 0).toLocaleString()}
                        </p>
                        {i === 0 && (
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Leading Bid</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Bid Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className={`glass-panel p-8 border-glow transition-all duration-500 ${bidFlash ? 'border-primary shadow-2xl shadow-primary/20 scale-[1.02]' : ''}`}>
                {/* Timer */}
                <div className="mb-8">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <FiClock size={12} className="text-primary" /> Remaining Duration
                  </p>
                  {timer.ended ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                      <p className="text-red-400 font-black uppercase tracking-widest text-sm">Bidding Finalized</p>
                    </div>
                  ) : (
                    <>
                      <div className={`grid grid-cols-3 gap-3 ${timer.urgent ? 'animate-pulse' : ''}`}>
                        {[{ val: timer.h, label: 'HRS' }, { val: timer.m, label: 'MIN' }, { val: timer.s, label: 'SEC' }].map(t => (
                          <div key={t.label} className={`rounded-2xl p-4 text-center border transition-all duration-500 ${timer.urgent ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                            <p className={`text-3xl font-black tracking-tighter ${timer.urgent ? 'text-red-400' : 'text-white'}`}>{pad(t.val)}</p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t.label}</p>
                          </div>
                        ))}
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={async () => {
                            try {
                              await require('../services/api').auctionAPI.update(auctionId, { status: 'completed' });
                              showMsg('success', 'DEMO: Auction forced to COMPLETED status.');
                              dispatch(fetchAuctionById(auctionId));
                            } catch (err) {
                              showMsg('error', 'Force end failed');
                            }
                          }}
                          className="w-full mt-4 py-2 border border-dashed border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
                        >
                          Force Finalize Auction
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Current Price */}
                <div className={`bg-dark-900/50 border rounded-2xl p-6 mb-8 transition-all duration-500 ${bidFlash ? 'border-primary bg-primary/5' : 'border-white/5'}`}>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">
                    {bids.length > 0 ? 'Current Value' : 'Opening Price'}
                  </p>
                  <p className="text-5xl font-black text-white tracking-tighter">
                    {auction?.status === 'sold' ? 'SOLD OUT' : `$${parseFloat(currentPrice || auction?.starting_price || 0).toLocaleString()}`}
                  </p>
                  {bidFlash && (
                    <div className="flex items-center gap-2 mt-3 animate-bounce">
                      <FiZap size={12} className="text-primary" />
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">New Bid Registered!</p>
                    </div>
                  )}
                </div>

                {/* Status Message */}
                {msg.text && (
                  <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold animate-in zoom-in duration-300 border ${
                    msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {msg.type === 'success' ? <FiCheckCircle size={18} className="flex-shrink-0" /> : <FiAlertCircle size={18} className="flex-shrink-0" />}
                    {msg.text}
                  </div>
                )}

                {/* Bid Form */}
                {!timer.ended && auction.status !== 'completed' && (
                  isAuthenticated ? (
                    isBuyer ? (
                      <form onSubmit={handleBidSubmit} className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Propose New Bid</label>
                          <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl group-focus-within:text-primary transition-colors">$</span>
                            <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                              placeholder={(parseFloat(currentPrice) + 100).toString()} 
                              min={parseFloat(currentPrice) + 1} step="any"
                              className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-white text-2xl font-black tracking-tighter focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300" />
                          </div>
                          <p className="text-[10px] text-gray-600 font-bold text-center uppercase tracking-widest">Increment must be at least $1.00</p>

                          {/* Recommended Fare Display */}
                          {recommendedBid && (
                            <div onClick={() => setBidAmount(recommendedBid.toString())}
                              className="p-4 bg-primary/5 border border-primary/20 rounded-2xl cursor-pointer hover:bg-primary/10 transition-all duration-300 group">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[9px] text-primary/70 font-black uppercase tracking-widest mb-1">V.I.B.E Recommended Fare</p>
                                  <p className="text-2xl font-black text-primary">${recommendedBid.toLocaleString()}</p>
                                </div>
                                <div className="text-[9px] text-primary/50 font-bold uppercase group-hover:text-primary transition">Click to apply →</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button type="submit"
                          className="w-full py-5 rounded-2xl bg-primary text-dark-900 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3">
                          <FiZap size={18} /> Authenticate Bid
                        </button>

                        {/* Add to Cart / Watchlist Button */}
                        {isBuyer && (
                          <div className="mt-4">
                            {inCart ? (
                              <button onClick={async () => {
                                  try {
                                    await dispatch(removeFromCart(parseInt(auctionId))).unwrap();
                                    setInCart(false);
                                    dispatch(fetchCartCount());
                                  } catch (err) {}
                                }}
                                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                                <FiPackage /> Remove from Cart
                              </button>
                            ) : (
                              <button onClick={async () => {
                                  try {
                                    await dispatch(addToCart(parseInt(auctionId))).unwrap();
                                    setInCart(true);
                                    dispatch(fetchCartCount());
                                  } catch (err) {}
                                }}
                                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                                <FiPackage /> Add to Cart
                              </button>
                            )}
                          </div>
                        )}

                      </form>
                    ) : (
                      <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <p className="text-primary text-[10px] font-black uppercase tracking-widest">Sellers cannot participate in bidding</p>
                      </div>
                    )
                  ) : (
                    <div className="p-8 bg-primary/5 border border-primary/20 rounded-2xl text-center space-y-4">
                      <p className="text-primary text-xs font-black uppercase tracking-widest">Authentication Required</p>
                      <Link to="/login" className="block w-full bg-primary text-dark-900 font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-primary-hover transition-all duration-300">
                        Login to Participate
                      </Link>
                    </div>
                  )
                )}
              </div>

              {/* Seller Integrity Card */}
              <div className="glass-panel p-8 border-glow">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-6">Seller Verification</h3>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center font-black text-2xl text-dark-900 shadow-lg shadow-primary/20">
                    {(auction.seller_name || auction.User?.username || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-black text-lg tracking-tight">{auction.seller_name || auction.User?.username || 'PremiumSeller'}</p>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle size={12} className="text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Identity Verified</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Rating</p>
                    <p className="text-white font-black">4.9/5.0</p>
                  </div>
                  <div className="text-center border-l border-white/5">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Sales</p>
                    <p className="text-white font-black">{auction.total_auctions_sold || 124}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WINNER OR IMMEDIATE TRANSACTION MODAL */}
      {((showTransaction || 
         ((timer.ended || auction.status === 'completed') && 
          (auction.highest_bidder_id === user?.user_id || auction.highest_bidder_id === user?.id))) && 
        (auction.status !== 'sold' || txStep === 3)) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="max-w-md w-full glass-panel p-8 border-glow space-y-8">
            {txStep === 1 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
                  <FiCheckCircle size={48} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    {timer.ended || auction.status === 'completed' ? 'Congratulations!' : 'Bid Authenticated!'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2 font-medium">
                    {timer.ended || auction.status === 'completed' ? (
                      <>You won the auction for <span className="text-white">"{auction.title}"</span> with a bid of <span className="text-primary font-black">${parseFloat(currentPrice).toLocaleString()}</span>.</>
                    ) : (
                      <>You have placed a leading bid of <span className="text-primary font-black">${parseFloat(currentPrice).toLocaleString()}</span> on <span className="text-white">"{auction.title}"</span>.</>
                    )}
                  </p>
                </div>
                <p className="text-xl font-bold text-white uppercase tracking-widest">Are you buying this product?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleFinalize('buy')}
                    className="btn-premium py-4 text-xs">YES, PROCEED</button>
                  <button onClick={() => handleFinalize('leave')}
                    className="btn-glass py-4 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10">NO, LEAVE IT</button>
                </div>
              </div>
            )}

            {txStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setTxStep(1)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition"><FiChevronLeft /></button>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Secure Transaction</h2>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total Amount Due</p>
                    <p className="text-3xl font-black text-primary">${parseFloat(currentPrice).toLocaleString()}</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Card Details (Simulation)</label>
                    <div className="relative">
                      <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" placeholder="4242 4242 4242 4242" disabled className="glass-input w-full pl-12 opacity-50 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <button onClick={processPayment} disabled={txLoading}
                  className="w-full btn-premium py-4 text-xs flex items-center justify-center gap-3">
                  {txLoading ? <FiActivity className="animate-spin" /> : <><FiLock /> SECURE PAY NOW</>}
                </button>
              </div>
            )}

            {txStep === 3 && (
              <div className="text-center space-y-6 py-6">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <FiCheck size={56} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ownership Confirmed</h2>
                  <p className="text-emerald-400/80 text-sm font-bold uppercase tracking-widest mt-2">Transaction Successful</p>
                  <p className="text-gray-400 text-sm mt-4 leading-relaxed">The product has been transferred to your inventory. The seller will contact you shortly for shipping details.</p>
                </div>
                <button onClick={() => { setTxStep(1); navigate('/dashboard'); }}
                  className="w-full btn-glass py-4 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 uppercase font-black">
                  Back to Dashboard <FiArrowRight className="inline ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
