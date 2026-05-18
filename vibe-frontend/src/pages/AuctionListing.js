import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuctions, setFilters as setReduxFilters } from '../redux/slices/auctionSlice';
import { FiSearch, FiFilter, FiClock, FiTrendingUp, FiX, FiGrid } from 'react-icons/fi';

const CATEGORIES = [
  { id: 1, name: 'Fine Art', icon: '🎨' },
  { id: 2, name: 'Electronics', icon: '💻' },
  { id: 3, name: 'Jewelry', icon: '💎' },
  { id: 4, name: 'Luxury Furniture', icon: '🛋️' },
  { id: 5, name: 'Collectibles', icon: '🏺' }
];

function useCountdown(endTime) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    if (!endTime) return;
    const calc = () => {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3600000);
      if (h > 24) setTimeLeft(`${Math.floor(h / 24)}d ${h % 24}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return { timeLeft, urgent };
}

function AuctionCard({ auction }) {
  const endTime = auction.endTime || auction.end_time;
  const { timeLeft, urgent } = useCountdown(endTime);
  const coverImage = auction.primary_image_url || (auction.images ? JSON.parse(auction.images)[0] : 'https://images.unsplash.com/photo-1588626601614-22b07e7b6401?w=800&q=80');
  const startPrice = auction.startPrice || auction.starting_price || 0;
  const isSold = auction.status === 'sold';
  
  return (
    <Link to={`/auction/${auction.id || auction.auction_id}`}
      className={`glass-card flex flex-col group border-glow h-full ${isSold ? 'opacity-85 hover:opacity-100' : ''}`}>
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
        <img src={coverImage} alt={auction.title}
          className={`w-full h-full object-cover group-hover:scale-110 transition duration-700 ${isSold ? 'grayscale-[40%]' : ''}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-60" />
        
        {isSold && (
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-sm font-black text-red-500 tracking-widest uppercase border-2 border-red-500 px-4 py-2 bg-dark-950/80 rounded-lg shadow-2xl">SOLD OUT</span>
          </div>
        )}
        
        <div className={`absolute top-3 right-3 text-[10px] font-black px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-xl border ${isSold ? 'bg-red-500/20 text-red-400 border-red-500/30' : urgent ? 'bg-red-500 text-white border-red-400' : 'bg-dark-900/80 text-primary border-primary/30'}`}>
          <FiClock size={12} /> {isSold ? 'SOLD OUT' : timeLeft}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-black text-white text-lg tracking-tight line-clamp-1 group-hover:text-primary transition">
            {auction.title} {isSold && <span className="text-red-500 text-xs font-black ml-2 uppercase">(SOLD OUT)</span>}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-[10px]">👤</div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{auction.seller_name || auction.User?.username || 'Verified Seller'}</p>
          </div>
        </div>
        
        <div className="mt-6 flex items-end justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{isSold ? 'Final Value' : 'Current Bid'}</p>
            <p className="text-2xl font-black text-white">
              ${parseFloat(auction.current_price || startPrice).toLocaleString()}
            </p>
          </div>
          {isSold ? (
            <div className="text-red-500 font-black text-xs uppercase bg-red-500/10 border border-red-500/20 py-2 px-4 rounded-xl">SOLD</div>
          ) : (
            <div className="btn-premium py-2 px-4 text-xs">BID NOW</div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="h-6 bg-slate-700 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function AuctionListing() {
  const dispatch = useDispatch();
  const { auctions, loading } = useSelector(state => state.auction);
  
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: '',
    sortBy: 'trending',
    minPrice: '',
    maxPrice: '',
    searchTerm: ''
  });

  useEffect(() => {
    const activeFilters = { status: 'active,sold' };
    if (localFilters.category) activeFilters.categoryId = localFilters.category;
    dispatch(fetchAuctions(activeFilters));
  }, [dispatch, localFilters.category]);

  const filteredAuctions = auctions.filter(a => {
    const startPrice = parseFloat(a.current_price || a.starting_price || 0);
    if (localFilters.searchTerm && !a.title.toLowerCase().includes(localFilters.searchTerm.toLowerCase())) return false;
    if (localFilters.minPrice && startPrice < parseFloat(localFilters.minPrice)) return false;
    if (localFilters.maxPrice && startPrice > parseFloat(localFilters.maxPrice)) return false;
    return true;
  }).sort((a, b) => {
    const priceA = parseFloat(a.current_price || a.starting_price || 0);
    const priceB = parseFloat(b.current_price || b.starting_price || 0);
    if (localFilters.sortBy === 'price-low') return priceA - priceB;
    if (localFilters.sortBy === 'price-high') return priceB - priceA;
    const endA = new Date(a.endTime || a.end_time);
    const endB = new Date(b.endTime || b.end_time);
    if (localFilters.sortBy === 'ending') return endA - endB;
    return new Date(b.createdAt || b.start_time) - new Date(a.createdAt || a.start_time);
  });

  const set = (key, val) => setLocalFilters(p => ({ ...p, [key]: val }));
  const clearFilters = () => setLocalFilters({ category: '', sortBy: 'trending', minPrice: '', maxPrice: '', searchTerm: '' });
  const hasActiveFilters = localFilters.category || localFilters.minPrice || localFilters.maxPrice || localFilters.searchTerm;

  return (
    <div className="min-h-screen bg-mesh bg-dark-900 animate-in">
      {/* Search & Filter Header */}
      <div className="sticky top-16 z-30 bg-dark-950/80 backdrop-blur-xl border-b border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex-1 w-full relative">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input type="text" placeholder="Search the marketplace..." value={localFilters.searchTerm}
                onChange={e => set('searchTerm', e.target.value)}
                className="glass-input w-full pl-14 pr-12 text-lg font-medium" />
              {localFilters.searchTerm && (
                <button onClick={() => set('searchTerm', '')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <FiX size={20} />
                </button>
              )}
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
              <select value={localFilters.sortBy} onChange={e => set('sortBy', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-2 focus:ring-primary outline-none">
                <option className="bg-slate-900 text-white" value="trending">NEW ARRIVALS</option>
                <option className="bg-slate-900 text-white" value="ending">ENDING SOON</option>
                <option className="bg-slate-900 text-white" value="price-low">PRICE: LOW TO HIGH</option>
                <option className="bg-slate-900 text-white" value="price-high">PRICE: HIGH TO LOW</option>
              </select>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all border ${showFilters || hasActiveFilters ? 'bg-primary text-dark-900 border-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                <FiFilter size={18} /> FILTERS
                {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 p-8 glass-panel grid grid-cols-1 md:grid-cols-4 gap-8 border-glow">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Category</label>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => set('category', '')} className={`text-left px-4 py-2 rounded-lg text-sm font-bold transition ${!localFilters.category ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>All Collections</button>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => set('category', c.id)} className={`text-left px-4 py-2 rounded-lg text-sm font-bold transition ${localFilters.category == c.id ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>
                      <span className="mr-2">{c.icon}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Min Price</label>
                <input type="number" placeholder="$ 0" value={localFilters.minPrice} onChange={e => set('minPrice', e.target.value)}
                  className="glass-input w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Max Price</label>
                <input type="number" placeholder="$ 1M+" value={localFilters.maxPrice} onChange={e => set('maxPrice', e.target.value)}
                  className="glass-input w-full" />
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="btn-glass w-full border-red-500/20 text-red-400 hover:bg-red-500/10">RESET ALL</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-32 glass-panel border-dashed border-white/10">
            <FiGrid size={80} className="mx-auto text-gray-700 mb-6" />
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">NO LOTS FOUND</h2>
            <p className="text-gray-500 font-medium mb-8">Try broadening your search or resetting filters.</p>
            <button onClick={clearFilters} className="btn-premium">Clear All Filters</button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">
                Displaying {filteredAuctions.length} Results
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live Market Data
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAuctions.map(a => <AuctionCard key={a.id || a.auction_id} auction={a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
