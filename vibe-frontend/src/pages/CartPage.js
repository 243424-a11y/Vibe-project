import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(state => state.cart);
  const user = useSelector(state => state.auth.user);

  const isBuyer = !user || user?.role === 'buyer' || !user?.role;

  useEffect(() => {
    if (isBuyer) dispatch(fetchCart());
  }, [dispatch, isBuyer]);

  if (!isBuyer) return null;

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-400">My Watchlist</h1>
          <div>
            <button
              onClick={() => dispatch(clearCart())}
              className="rounded-xl px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-all duration-200"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            Your watchlist is empty. Browse auctions and add items you want to follow.
          </div>
        )}

        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.auction_id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-700 bg-slate-800">
              <img src={item.primary_image_url} alt={item.title} className="w-28 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <Link to={`/auction/${item.auction_id}`} className="text-lg font-semibold text-amber-400 hover:underline">
                  {item.title}
                </Link>
                <div className="text-sm text-slate-400">{item.category}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-white font-semibold">${item.current_price}</div>
                  <div className="text-sm text-slate-400">Ends: {new Date(item.end_time).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-sm ${item.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  {item.status}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => dispatch(removeFromCart(item.auction_id))}
                    className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all duration-200"
                  >
                    Remove
                  </button>
                  <Link to={`/auction/${item.auction_id}`} className="rounded-xl px-4 py-2 border border-slate-700 text-amber-400 font-semibold hover:bg-slate-700 transition-all duration-200">
                    View Auction
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
