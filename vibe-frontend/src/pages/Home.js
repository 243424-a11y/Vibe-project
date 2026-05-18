import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiClock, FiStar, FiTrendingUp, FiArrowRight, FiShield, FiZap, FiAward, FiUsers } from 'react-icons/fi';

function Home() {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Mock auction data with better images
  const [auctions] = useState([
    {
      id: 1,
      title: 'Contemporary Glass Vase',
      category: 'Art & Collectibles',
      currentPrice: 450,
      startPrice: 100,
      image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=300&fit=crop',
      seller: { name: 'John Smith', rating: 4.8 },
      bidsCount: 24,
      endTime: '2 hours',
      condition: 'Excellent'
    },
    {
      id: 2,
      title: 'Vintage Wooden Furniture',
      category: 'Furniture',
      currentPrice: 320,
      startPrice: 80,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
      seller: { name: 'Sarah Johnson', rating: 4.9 },
      bidsCount: 18,
      endTime: '5 hours',
      condition: 'Good'
    },
    {
      id: 3,
      title: 'Luxury Wristwatch',
      category: 'Jewelry & Watches',
      currentPrice: 1890,
      startPrice: 200,
      image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=300&fit=crop',
      seller: { name: 'Mike Davis', rating: 4.7 },
      bidsCount: 32,
      endTime: '8 hours',
      condition: 'Like New'
    },
    {
      id: 4,
      title: 'Vintage Camera',
      category: 'Electronics',
      currentPrice: 650,
      startPrice: 150,
      image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&h=300&fit=crop',
      seller: { name: 'Emily Wilson', rating: 4.6 },
      bidsCount: 28,
      endTime: '3 hours',
      condition: 'Excellent'
    },
    {
      id: 5,
      title: 'Gold Jewelry Collection',
      category: 'Jewelry & Watches',
      currentPrice: 2280,
      startPrice: 50,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop',
      seller: { name: 'Lisa Anderson', rating: 4.9 },
      bidsCount: 15,
      endTime: '4 hours',
      condition: 'Excellent'
    },
    {
      id: 6,
      title: 'Rare Book Collection',
      category: 'Art & Collectibles',
      currentPrice: 520,
      startPrice: 100,
      image: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=300&fit=crop',
      seller: { name: 'James Brown', rating: 4.5 },
      bidsCount: 41,
      endTime: '12 hours',
      condition: 'Very Good'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Art & Collectibles', 'Furniture', 'Jewelry & Watches', 'Electronics'];

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || auction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.currentPrice - b.currentPrice;
      case 'price-high':
        return b.currentPrice - a.currentPrice;
      case 'newest':
        return b.id - a.id;
      case 'trending':
      default:
        return b.bidsCount - a.bidsCount;
    }
  });

  const topCategories = [
    {
      name: 'Art & Collectibles',
      image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&h=200&fit=crop',
      count: 2
    },
    {
      name: 'Jewelry & Watches',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop',
      count: 2
    },
    {
      name: 'Furniture',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
      count: 1
    },
    {
      name: 'Electronics',
      image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=200&h=200&fit=crop',
      count: 1
    }
  ];

  return (
    <div className="min-h-screen bg-mesh bg-dark-900 animate-in">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8 animate-glow">
            The Future of Digital Auctions
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
            DISCOVER <br />
            <span className="text-gradient">RARE FINDS.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium">
            Join the elite circle of collectors on the most secure, real-time bidding engine ever built.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/register" 
                  className="btn-premium flex items-center gap-3 group"
                >
                  Start Your Journey
                  <FiArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/auctions" 
                  className="btn-glass"
                >
                  Live Auctions
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn-premium">Go to My Dashboard</Link>
            )}
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {[
              { label: 'Active Auctions', value: '120+', icon: FiTrendingUp },
              { label: 'Global Bidders', value: '5K+', icon: FiUsers },
              { label: 'Fraud Protected', value: '100%', icon: FiShield },
            ].map((s, idx) => (
              <div key={s.label} className="glass-card p-8 border-glow" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex flex-col items-center">
                  <s.icon className="text-primary mb-4" size={32} />
                  <div className="text-4xl font-black text-white mb-1">{s.value}</div>
                  <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">Curated Selections</h2>
              <h3 className="text-5xl font-black text-white tracking-tighter">EXPLORE CATEGORIES</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {topCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className="group glass-card overflow-hidden h-80 relative"
              >
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-8 text-left">
                  <h3 className="text-2xl font-black text-white mb-1">{category.name}</h3>
                  <p className="text-primary text-xs font-bold uppercase tracking-widest">{category.count} ACTIVE LOTS</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-5xl font-black text-white tracking-tighter">FEATURED LOTS</h2>
            <Link to="/auctions" className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all">
              VIEW MARKETPLACE
              <FiArrowRight size={20} />
            </Link>
          </div>

          {/* Auctions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {auctions.slice(0, 3).map(auction => (
              <Link
                key={auction.id}
                to={`/auction/${auction.id}`}
                className="glass-card overflow-hidden group border-glow"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="badge-premium bg-dark-900/80 backdrop-blur-md text-primary border-primary/30">
                      {auction.category}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{auction.seller.name}</span>
                    <div className="flex items-center gap-1">
                      <FiStar size={12} className="text-primary fill-primary" />
                      <span className="text-xs font-bold text-white">{auction.seller.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white mb-6 group-hover:text-primary transition line-clamp-1">{auction.title}</h3>
                  
                  <div className="flex items-end justify-between border-t border-white/5 pt-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Bid</p>
                      <p className="text-3xl font-black text-white">${auction.currentPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black text-xs bg-primary/10 px-3 py-1 rounded-full">
                      <FiClock size={14} />
                      {auction.endTime}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto glass-panel p-16 text-center border-glow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full"></div>
          
          <h2 className="text-4xl font-black text-white mb-6">READY TO CLAIM YOUR TREASURE?</h2>
          <p className="text-gray-400 mb-10 text-lg">Join 50,000+ active bidders and start your collection today.</p>
          <div className="flex justify-center gap-6">
            <Link to="/register" className="btn-premium">Create Free Account</Link>
            <Link to="/auctions" className="btn-glass">Browse All</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
