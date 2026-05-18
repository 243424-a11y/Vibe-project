import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionAPI } from '../services/api';
import { FiUploadCloud, FiPlus, FiInfo, FiDollarSign, FiClock, FiCheck } from 'react-icons/fi';

export default function CreateAuction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startPrice: '',
    reservePrice: '',
    categoryId: '1', // Default category
    condition: 'New',
    durationDays: '7',
    imageUrl: ''
  });

  const categories = [
    { id: 1, name: 'Antiques' },
    { id: 2, name: 'Art' },
    { id: 3, name: 'Jewelry' },
    { id: 4, name: 'Collectibles' },
    { id: 5, name: 'Electronics' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate endTime based on durationDays
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + parseInt(formData.durationDays));

      const payload = {
        title: formData.title,
        description: formData.description,
        startPrice: parseFloat(formData.startPrice),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        categoryId: parseInt(formData.categoryId),
        condition: formData.condition,
        endTime: endTime.toISOString(),
        images: [formData.imageUrl || 'https://images.unsplash.com/photo-1588626601614-22b07e7b6401?w=800&q=80']
      };

      await auctionAPI.create(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Auction</h1>
          <p className="text-gray-400">List your premium items to thousands of active buyers.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <FiInfo size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">1. Item Details</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Title</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange}
                placeholder="e.g. Vintage Rolex Submariner"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Category</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition appearance-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Condition</label>
                <select name="condition" value={formData.condition} onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition appearance-none">
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Description</label>
              <textarea name="description" required value={formData.description} onChange={handleChange} rows="5"
                placeholder="Describe your item in detail..."
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition resize-none"></textarea>
            </div>
          </div>

          {/* Pricing & Time */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">2. Pricing & Format</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Starting Price</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" name="startPrice" required min="1" value={formData.startPrice} onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Reserve Price (Optional)</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" name="reservePrice" min="1" value={formData.reservePrice} onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Duration</label>
                <div className="relative">
                  <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select name="durationDays" value={formData.durationDays} onChange={handleChange}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none transition appearance-none">
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="10">10 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">3. Media</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Upload Primary Image</label>
              <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-6 bg-slate-700/30 hover:bg-slate-700/50 transition cursor-pointer">
                <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-300 mb-1">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, imageUrl: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              {formData.imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-300 mb-2">Image Preview:</p>
                  <img src={formData.imageUrl} alt="Preview" className="h-32 rounded-lg object-cover border border-slate-600" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-black text-lg py-4 rounded-xl transition shadow-lg shadow-amber-400/20">
              {loading ? <span className="animate-pulse">Creating...</span> : <><FiCheck size={20} /> List Item for Auction</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
