'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShoppingCart, FileText, CheckCircle2, AlertCircle, ShoppingBag, Trash2, User, MapPin, Globe, Menu, X } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function ShopPage() {
  const router = useRouter();
  
  // Localized States
  const [lang, setLang] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);

  // App States
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [activeView, setActiveView] = useState('catalog'); // 'catalog' | 'history'

  // Form states
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');
  const [useLiveLocation, setUseLiveLocation] = useState(true);

  // Status/Loading States
  const [loading, setLoading] = useState(true);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Load language preference
    const saved = localStorage.getItem('cig-bid-lang');
    if (saved) setLang(saved);

    fetchUserData();
  }, []);

  const t = translations[lang] || translations.en;

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('cig-bid-lang', nextLang);
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        throw new Error('Not authenticated');
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Pre-fill delivery address from user details
      if (userData.user.address) {
        setDeliveryStreet(userData.user.address.street || '');
        setDeliveryCity(userData.user.address.city || '');
        setDeliveryState(userData.user.address.state || '');
        setDeliveryZip(userData.user.address.zipCode || '');
      }

      // Fetch products and orders
      await Promise.all([fetchProducts(), fetchOrders()]);
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Helper to fetch live GPS location from browser Geolocation API
  const getGPSCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  };

  // Cart operations
  const updateCartQty = (productId, qty, minQty, maxStock) => {
    if (qty <= 0) {
      const updated = { ...cart };
      delete updated[productId];
      setCart(updated);
      return;
    }
    
    // Enforce MOQ
    if (qty < minQty) {
      qty = minQty;
    }

    // Enforce Stock limit
    if (qty > maxStock) {
      qty = maxStock;
      setError(lang === 'en' ? `Cannot exceed stock of ${maxStock}` : `स्टॉक सीमा ${maxStock} से अधिक नहीं हो सकती`);
      setTimeout(() => setError(''), 3000);
    }

    setCart({ ...cart, [productId]: qty });
  };

  const removeFromCart = (productId) => {
    const updated = { ...cart };
    delete updated[productId];
    setCart(updated);
  };

  const calculateCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([prodId, qty]) => {
      const product = products.find(p => p._id === prodId);
      if (product) {
        total += product.price * qty;
      }
    });
    return total;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setOrderSubmitting(true);

    const orderItems = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    if (orderItems.length === 0) {
      setError(t.cartEmpty);
      setOrderSubmitting(false);
      return;
    }

    // Acquire GPS Coordinates first
    let gpsCoords = null;
    if (useLiveLocation) {
      setError(t.gpsRequired);
      try {
        gpsCoords = await getGPSCoordinates();
        setSuccess(t.gpsAcquired);
        setError('');
      } catch (err) {
        setError(t.gpsFailed);
        setOrderSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: {
            street: deliveryStreet,
            city: deliveryCity,
            state: deliveryState,
            zipCode: deliveryZip,
          },
          gpsLocation: gpsCoords, // Inject the GPS coordinates into the order payload
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setSuccess(t.orderSuccess);
      setCart({});
      fetchOrders(); // Refresh order history
      fetchProducts(); // Refresh stock counts
      
      // Switch view
      setTimeout(() => {
        setActiveView('history');
        setSuccess('');
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0c0c0e] text-slate-100 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading Distributor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-[#0c0c0e] via-[#121216] to-[#08080a] text-slate-100 min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
            {/* Header Dashboard Banner */}
      <header className="border-b border-slate-900 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent whitespace-nowrap">
              {t.brandTitle}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold tracking-wider whitespace-nowrap">
              {t.b2bOnly}
            </span>
            {user?.role === 'admin' && (
              <span className="text-[9px] sm:text-[10px] uppercase bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/20 font-bold whitespace-nowrap">
                Admin
              </span>
            )}
          </div>
          
          {/* Desktop Nav Controls */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Language Switch Button */}
            <button
              onClick={toggleLanguage}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <User className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200">{user?.businessName}</span>
              <span className="text-xs text-slate-500">({user?.phone})</span>
            </div>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
              >
                {t.adminPanel}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-1.5 transition-colors font-semibold"
            >
              <LogOut className="w-4 h-4" /> {t.signOut}
            </button>
          </div>

          {/* Mobile Menu Action Button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Quick Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold p-1.5 rounded-lg border border-slate-700 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            {/* Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-300 hover:text-amber-400 p-2 focus:outline-none"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {menuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-800/60 flex flex-col gap-3">
            
            {/* User details card */}
            <div className="bg-slate-905/40 p-3 rounded-lg border border-slate-800/60 bg-black/30">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Logged In Shop</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-slate-200 leading-tight">{user?.businessName}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.phone}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/admin');
                }}
                className="w-full text-center text-xs bg-amber-500 text-black font-extrabold py-2.5 rounded-lg shadow transition-all"
              >
                {t.adminPanel}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full text-center text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> {t.signOut}
            </button>
          </div>
        )}
      </header>

      {/* Main Panel grid */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 grid lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation tabs */}
          <div className="flex bg-black/40 border border-slate-800 p-1.5 rounded-xl max-w-sm">
            <button
              onClick={() => setActiveView('catalog')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                activeView === 'catalog'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> {t.catalog}
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                activeView === 'history'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> {t.history}
            </button>
          </div>

          {/* Catalog View */}
          {activeView === 'catalog' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-200">{t.wholesaleCatalog}</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {products.map((product) => {
                  const currentCartQty = cart[product._id] || 0;
                  return (
                    <div
                      key={product._id}
                      className="bg-gradient-to-b from-[#181820] to-[#101014] border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-slate-200 text-base line-clamp-1">
                            {product.name}
                          </h3>
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono shrink-0">
                            {product.sku}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                        
                        <div className="flex justify-between items-baseline pt-2">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Unit Price</span>
                            <span className="text-lg font-extrabold text-amber-400">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">{t.moq} / Stock</span>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-semibold text-slate-300">
                                {product.minOrderQty} {t.units} / {product.stock} {t.available}
                              </span>
                              {product.stock < product.minOrderQty && (
                                <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold border border-red-500/30">
                                  Sold Out
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Add to Cart Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-800/80">
                        {currentCartQty > 0 ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center border border-slate-700 rounded-lg bg-black/30 overflow-hidden">
                              <button
                                onClick={() => updateCartQty(product._id, currentCartQty - 1, product.minOrderQty, product.stock)}
                                className="px-3 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-sm font-semibold text-slate-200 min-w-8 text-center">
                                {currentCartQty}
                              </span>
                              <button
                                onClick={() => updateCartQty(product._id, currentCartQty + 1, product.minOrderQty, product.stock)}
                                className="px-3 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(product._id)}
                              className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateCartQty(product._id, product.minOrderQty, product.minOrderQty, product.stock)}
                            disabled={product.stock < product.minOrderQty}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 font-semibold py-2 rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {product.stock < product.minOrderQty ? t.outOfStock : `${t.addToCart} (Min: ${product.minOrderQty})`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order History View */}
          {activeView === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-200">{t.history}</h2>
              
              {orders.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{lang === 'en' ? 'No orders placed yet.' : 'अभी तक कोई ऑर्डर नहीं दिया गया है।'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-[#141419] border border-slate-800/80 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-xs text-slate-500 block">{t.orderRef}</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-200 font-mono block max-w-full break-all">
                            #{order._id.substring(12)}
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-xs text-slate-500 block text-left sm:text-right">{t.orderDate}</span>
                            <span className="text-xs text-slate-300">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 block text-left sm:text-right">{t.status}</span>
                            <span className="text-xs uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">
                              {item.name} <span className="text-xs text-slate-500">x{item.quantity}</span>
                            </span>
                            <span className="text-slate-200 font-semibold">
                              ₹{(item.priceAtOrder * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total and Shipping */}
                      <div className="border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex flex-col gap-1 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              {t.deliveryTo}: {order.shippingAddress.street}, {order.shippingAddress.city}
                            </span>
                          </div>
                          {order.gpsLocation && (
                            <div className="text-[10px] text-amber-500/80 font-mono ml-5">
                              GPS: {order.gpsLocation.latitude.toFixed(6)}, {order.gpsLocation.longitude.toFixed(6)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-slate-500">{t.totalAmount} (COD):</span>
                          <span className="text-base font-extrabold text-amber-400">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Sidebar: Cart Panel (Only show in catalog view) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-[#181820]/90 to-[#101014]/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl sticky top-24 space-y-6">
            <h3 className="font-bold text-slate-200 text-lg border-b border-slate-800 pb-3 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" /> {t.yourCart}
            </h3>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg text-xs flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {Object.keys(cart).length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-25" />
                <p>{t.cartEmpty}</p>
                <p className="text-xs text-slate-600">{t.selectItems}</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                
                {/* Cart list items */}
                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {Object.entries(cart).map(([prodId, qty]) => {
                    const product = products.find(p => p._id === prodId);
                    if (!product) return null;
                    return (
                      <div key={prodId} className="flex justify-between items-center text-sm gap-2">
                        <div className="truncate">
                          <span className="text-slate-200 font-bold truncate block">
                            {product.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {qty} units @ ₹{product.price}/unit
                          </span>
                        </div>
                        <span className="text-slate-200 font-extrabold shrink-0">
                          ₹{(product.price * qty).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal */}
                <div className="border-t border-slate-800/80 pt-4 flex justify-between items-baseline">
                  <span className="text-sm text-slate-400 font-semibold">{t.subtotal}:</span>
                  <span className="text-xl font-black text-amber-400">
                    ₹{calculateCartTotal().toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Shipping address edit */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> {t.confirmDelivery}
                  </span>
                  
                  <div className="flex flex-col sm:flex-row gap-3 bg-black/30 p-2.5 rounded-lg border border-slate-800">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-amber-400">
                      <input type="radio" checked={useLiveLocation} onChange={() => setUseLiveLocation(true)} className="accent-amber-500 w-3.5 h-3.5" />
                      Use Live GPS Location
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-amber-400">
                      <input type="radio" checked={!useLiveLocation} onChange={() => setUseLiveLocation(false)} className="accent-amber-500 w-3.5 h-3.5" />
                      Use Typed Address Only
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder={lang === 'en' ? "Street Address" : "गली का पता"}
                      value={deliveryStreet}
                      onChange={(e) => setDeliveryStreet(e.target.value)}
                      className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder={t.city}
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                      />
                      <input
                        type="text"
                        required
                        placeholder={t.state}
                        value={deliveryState}
                        onChange={(e) => setDeliveryState(e.target.value)}
                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                      />
                      <input
                        type="text"
                        required
                        placeholder={t.zipCode}
                        value={deliveryZip}
                        onChange={(e) => setDeliveryZip(e.target.value)}
                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3 rounded-lg shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                >
                  {orderSubmitting ? t.orderProcessing : t.placeOrder}
                </button>
                <div className="text-center space-y-1">
                  {useLiveLocation ? (
                    <>
                      <span className="text-[10px] text-amber-500/90 font-bold block uppercase tracking-wider animate-pulse">
                        🛰️ GPS Geolocation Required
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {t.codVerify}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-500 block">
                      GPS Disabled. Routing will rely on typed address.
                    </span>
                  )}
                </div>

              </form>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
