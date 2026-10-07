'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, CheckCircle2, UserCheck, UserX, ArrowLeft, Loader2, MapPin, Globe, ShoppingBag, FileText, ExternalLink, Package, Trash2, Plus } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function AdminPage() {
  const router = useRouter();
  
  // Localized States
  const [lang, setLang] = useState('en');
  const [adminTab, setAdminTab] = useState('vendors'); // 'vendors' | 'orders'

  // Data States
  const [adminUser, setAdminUser] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '', price: '', minOrderQty: '1', stock: '0', image: '' });
  const [productSubmitting, setProductSubmitting] = useState(false);
  
  // Loading & Status
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [orderActionId, setOrderActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Load language preference
    const saved = localStorage.getItem('cig-bid-lang');
    if (saved) setLang(saved);

    fetchAdminStatus();
  }, []);

  const t = translations[lang] || translations.en;

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('cig-bid-lang', nextLang);
  };

  const fetchAdminStatus = async () => {
    try {
      setLoading(true);
      // Verify admin role
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        throw new Error('Not authenticated');
      }
      const userData = await userRes.json();
      
      if (userData.user.role !== 'admin') {
        throw new Error('Unauthorized access');
      }
      
      setAdminUser(userData.user);
      await Promise.all([fetchVendors(), fetchOrders(), fetchProducts()]);
    } catch (err) {
      setError(err.message);
      setTimeout(() => {
        router.push('/shop');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors');
      if (!res.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setProductSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');
      setSuccess('Product added successfully!');
      setNewProduct({ name: '', sku: '', description: '', price: '', minOrderQty: '1', stock: '0', image: '' });
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/products?id=' + id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      setSuccess('Product deleted successfully!');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprovalChange = async (userId, newApprovalState) => {
    setError('');
    setSuccess('');
    setActionLoadingId(userId);

    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isApproved: newApprovalState }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update approval status');
      }

      setSuccess(data.message);
      
      // Update local vendors list
      setVendors(prev => 
        prev.map(v => v._id === userId ? { ...v, isApproved: newApprovalState } : v)
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setError('');
    setSuccess('');
    setOrderActionId(orderId);

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderStatus: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setSuccess(data.message);
      
      // Update local orders list
      setOrders(prev => 
        prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setOrderActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0c0c0e] text-slate-100 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-slate-400">Verifying Admin Permissions...</p>
        </div>
      </div>
    );
  }

  if (error && !adminUser) {
    return (
      <div className="flex-1 bg-[#0c0c0e] text-slate-100 flex items-center justify-center min-h-screen">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl max-w-sm text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold">Access Denied</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <p className="text-xs text-slate-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-[#0c0c0e] via-[#121216] to-[#08080a] text-slate-100 min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-black/40 backdrop-blur-md px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-slate-400 hover:text-amber-400 flex items-center gap-1 text-sm font-semibold transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{lang === 'en' ? 'Back to Shop' : 'दुकान पर वापस जाएं'}</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="text-sm sm:text-base font-black tracking-wider text-slate-200 truncate max-w-[150px] sm:max-w-none">
                {t.adminPanel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch Button */}
            <button
              onClick={toggleLanguage}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/30 transition-all flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>

            <span className="hidden md:inline text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              Secure Admin
            </span>
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-900 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-200">
              {lang === 'en' ? 'B2B Hub Control Center' : 'B2B हब नियंत्रण केंद्र'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'en' ? 'Verify registrations and monitor bulk COD orders with live location mapping.' : 'पंजीकरण सत्यापित करें और सटीक डिलीवरी स्थान के साथ थोक ऑर्डर प्रबंधित करें।'}
            </p>
          </div>
          
          {/* Main admin navigation tabs */}
          <div className="flex bg-black/40 border border-slate-800 p-1 rounded-xl w-full md:w-auto shrink-0">
            <button
              onClick={() => setAdminTab('vendors')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'vendors'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> {t.viewVendors}
            </button>
            <button
              onClick={() => setAdminTab('orders')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'orders'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> {t.viewOrders}
            </button>
            <button
              onClick={() => setAdminTab('products')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'products'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Manage Products
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Dynamic Tab Views */}
        
        {/* VIEW 1: VENDORS/SHOPS */}
        {adminTab === 'vendors' && (
          <div className="bg-[#101014] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-black/10">
              <h3 className="font-bold text-slate-200 text-base">{t.registeredVendors}</h3>
            </div>
            
            {vendors.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <UserX className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">No shops registered yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-black/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Shop / Owner Details</th>
                        <th className="px-6 py-4">Verification IDs</th>
                        <th className="px-6 py-4">Registered Location</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {vendors.map((vendor) => (
                        <tr key={vendor._id} className="hover:bg-slate-900/30 transition-all">
                          
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-slate-200">
                                {vendor.businessName}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">{vendor.phone}</p>
                              {vendor.email && <p className="text-[10px] text-slate-500">{vendor.email}</p>}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-0.5 text-xs">
                              <p className="text-slate-300">
                                <span className="text-slate-500 font-semibold mr-1">Tax:</span>
                                {vendor.taxId || 'N/A'}
                              </p>
                              <p className="text-slate-300">
                                <span className="text-slate-500 font-semibold mr-1">License:</span>
                                {vendor.licenseNumber || 'N/A'}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <a
                              href={
                                vendor.address?.gpsLocation?.latitude
                                  ? `https://www.google.com/maps/dir/?api=1&destination=${vendor.address.gpsLocation.latitude},${vendor.address.gpsLocation.longitude}`
                                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                      (vendor.address?.street || '') + ', ' + (vendor.address?.city || '') + ', ' + (vendor.address?.state || '') + ' ' + (vendor.address?.zipCode || '')
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-1.5 text-xs text-slate-400 hover:text-amber-400 hover:underline max-w-xs transition-colors"
                            >
                              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <span>
                                {vendor.address?.street}, {vendor.address?.city}, {vendor.address?.state} {vendor.address?.zipCode}
                              </span>
                            </a>
                          </td>

                          <td className="px-6 py-4">
                            {vendor.isApproved ? (
                              <span className="inline-flex items-center text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                                {t.verified}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full animate-pulse">
                                {t.pendingReview}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            {actionLoadingId === vendor._id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-amber-500 ml-auto" />
                            ) : vendor.isApproved ? (
                              <button
                                onClick={() => handleApprovalChange(vendor._id, false)}
                                className="bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 hover:border-transparent text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto"
                              >
                                <UserX className="w-3.5 h-3.5" /> {t.suspend}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprovalChange(vendor._id, true)}
                                className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 hover:border-transparent text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> {t.approve}
                              </button>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card view (Required zero horizontal scrolling) */}
                <div className="md:hidden divide-y divide-slate-800/60 p-4 space-y-4">
                  {vendors.map((vendor) => (
                    <div key={vendor._id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-200 text-sm">{vendor.businessName}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{vendor.phone}</p>
                          {vendor.email && <p className="text-[10px] text-slate-500">{vendor.email}</p>}
                        </div>
                        <div>
                          {vendor.isApproved ? (
                            <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                              {t.verified}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full animate-pulse">
                              {t.pendingReview}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 bg-black/30 p-2.5 rounded-xl border border-slate-800/40">
                        <p><span className="text-slate-500 font-semibold">Tax ID:</span> {vendor.taxId || 'N/A'}</p>
                        <p><span className="text-slate-500 font-semibold">License:</span> {vendor.licenseNumber || 'N/A'}</p>
                      </div>

                      <div className="text-xs text-slate-400 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <a
                          href={
                            vendor.address?.gpsLocation?.latitude
                              ? `https://www.google.com/maps/dir/?api=1&destination=${vendor.address.gpsLocation.latitude},${vendor.address.gpsLocation.longitude}`
                              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  (vendor.address?.street || '') + ', ' + (vendor.address?.city || '') + ', ' + (vendor.address?.state || '') + ' ' + (vendor.address?.zipCode || '')
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-amber-400 hover:underline leading-relaxed"
                        >
                          {vendor.address?.street}, {vendor.address?.city}, {vendor.address?.state} {vendor.address?.zipCode}
                        </a>
                      </div>

                      <div className="pt-2 flex justify-end">
                        {actionLoadingId === vendor._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        ) : vendor.isApproved ? (
                          <button
                            onClick={() => handleApprovalChange(vendor._id, false)}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" /> {t.suspend}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprovalChange(vendor._id, true)}
                            className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> {t.approve}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 2: ORDERS MANAGEMENT */}
        {adminTab === 'orders' && (
          <div className="bg-[#101014] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-black/10">
              <h3 className="font-bold text-slate-200 text-base">{lang === 'en' ? 'Active Incoming Orders' : 'सक्रिय आवक ऑर्डर'}</h3>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">No orders placed in the system yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-black/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">{t.orderRef}</th>
                        <th className="px-6 py-4">{t.orderedBy}</th>
                        <th className="px-6 py-4">{t.contents}</th>
                        <th className="px-6 py-4">{t.totalAmount}</th>
                        <th className="px-6 py-4">{t.gpsLocation}</th>
                        <th className="px-6 py-4">{t.status}</th>
                        <th className="px-6 py-4 text-right">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-900/30 transition-all">
                          
                          <td className="px-6 py-4 font-mono text-xs text-slate-300">
                            <p className="font-bold text-slate-200">{order._id.substring(12)}</p>
                            <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-extrabold text-slate-200">{order.vendorDetails?.businessName}</p>
                              <p className="text-xs text-slate-400 font-mono">{order.vendorDetails?.phone}</p>
                              
                              <a
                                href={
                                  order.gpsLocation?.latitude
                                    ? `https://www.google.com/maps/dir/?api=1&destination=${order.gpsLocation.latitude},${order.gpsLocation.longitude}`
                                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                        (order.shippingAddress?.street || '') + ', ' + (order.shippingAddress?.city || '') + ', ' + (order.shippingAddress?.state || '') + ' ' + (order.shippingAddress?.zipCode || '')
                                      )}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-1 text-xs text-slate-400 hover:text-amber-400 hover:underline max-w-xs transition-colors mt-1"
                              >
                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span>
                                  {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                </span>
                              </a>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              {order.items.map((item, index) => (
                                <p key={index} className="text-slate-300">
                                  • {item.name} <span className="text-amber-500 font-bold">x{item.quantity}</span>
                                </p>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-4 font-bold text-slate-200">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </td>

                          <td className="px-6 py-4">
                            {order.gpsLocation ? (
                              <div className="space-y-1">
                                <span className="text-xs text-emerald-400 font-semibold block">
                                  🛰️ {order.gpsLocation.latitude.toFixed(5)}, {order.gpsLocation.longitude.toFixed(5)}
                                </span>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.gpsLocation.latitude},${order.gpsLocation.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  {t.viewMap} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-xs text-slate-400 font-semibold block italic">
                                  📝 Typed Address Only
                                </span>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                    (order.shippingAddress?.street || '') + ', ' + (order.shippingAddress?.city || '') + ', ' + (order.shippingAddress?.state || '') + ' ' + (order.shippingAddress?.zipCode || '')
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  {t.viewMap} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                              order.orderStatus === 'Delivered'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : order.orderStatus === 'Cancelled'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            {orderActionId === order._id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-amber-500 ml-auto" />
                            ) : (
                              <select
                                value={order.orderStatus}
                                onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                className="bg-black/50 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold py-1.5 px-2 rounded-lg focus:outline-none focus:border-amber-500"
                              >
                                <option value="Pending Delivery">Pending COD</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card view (Stacked, zero horizontal scrolling) */}
                <div className="md:hidden space-y-4 p-4">
                  {orders.map((order) => (
                    <div key={order._id} className="p-4 bg-[#141419]/40 rounded-xl border border-slate-800/60 space-y-3">
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider">{t.orderRef}</span>
                          <span className="font-bold text-slate-300 font-mono">#{order._id.substring(12)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider">{t.orderDate}</span>
                          <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="border-t border-b border-slate-800/40 py-2 space-y-1">
                        <p className="text-xs font-black text-slate-200">{order.vendorDetails?.businessName}</p>
                        <p className="text-xs text-slate-400 font-mono">{order.vendorDetails?.phone}</p>
                        
                        <a
                          href={
                            order.gpsLocation?.latitude
                              ? `https://www.google.com/maps/dir/?api=1&destination=${order.gpsLocation.latitude},${order.gpsLocation.longitude}`
                              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  (order.shippingAddress?.street || '') + ', ' + (order.shippingAddress?.city || '') + ', ' + (order.shippingAddress?.state || '') + ' ' + (order.shippingAddress?.zipCode || '')
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1 text-xs text-slate-400 hover:text-amber-400 hover:underline mt-1"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{order.shippingAddress?.street}, {order.shippingAddress?.city}</span>
                        </a>
                      </div>

                      {/* Items list */}
                      <div className="space-y-1 text-xs bg-black/10 p-2.5 rounded-lg border border-slate-800/30">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-slate-300">
                            <span>• {item.name}</span>
                            <span className="text-amber-500 font-extrabold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* GPS tracking link */}
                      {order.gpsLocation ? (
                        <div className="flex justify-between items-center text-xs bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                          <span className="text-[10px] text-emerald-400 font-mono">🛰️ {order.gpsLocation.latitude.toFixed(5)}, {order.gpsLocation.longitude.toFixed(5)}</span>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${order.gpsLocation.latitude},${order.gpsLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            {t.viewMap} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs bg-slate-800/30 p-2 rounded-lg border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 font-mono italic">📝 Typed Address</span>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              (order.shippingAddress?.street || '') + ', ' + (order.shippingAddress?.city || '') + ', ' + (order.shippingAddress?.state || '') + ' ' + (order.shippingAddress?.zipCode || '')
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            {t.viewMap} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/40 flex justify-between items-center gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 mr-1 uppercase tracking-wider">{t.totalAmount}:</span>
                          <span className="text-sm font-extrabold text-amber-400">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        </div>

                        {orderActionId === order._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        ) : (
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                            className="bg-black/50 border border-slate-800 text-xs text-slate-300 font-semibold py-1 px-2 rounded-lg focus:outline-none"
                          >
                            <option value="Pending Delivery">Pending COD</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 3: PRODUCTS MANAGEMENT */}
        {adminTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-[#101014] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-amber-500"/> Add New Product</h3>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <input required type="text" placeholder="SKU (e.g. CIG-01)" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <input required type="number" placeholder="Price (₹)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <input required type="number" placeholder="Min Order Qty (MOQ)" value={newProduct.minOrderQty} onChange={e => setNewProduct({...newProduct, minOrderQty: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <input required type="number" placeholder="Stock Available" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <input type="text" placeholder="Image URL (Optional)" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" />
                <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="bg-black/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 md:col-span-2" rows="2"></textarea>
                <button type="submit" disabled={productSubmitting} className="md:col-span-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-lg transition-all disabled:opacity-50">
                  {productSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </form>
            </div>

            <div className="bg-[#101014] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 bg-black/10">
                <h3 className="font-bold text-slate-200 text-base flex items-center gap-2"><Package className="w-5 h-5 text-amber-500"/> Current Catalog</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-black/20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock / MOQ</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {products.map(p => (
                      <tr key={p._id} className="hover:bg-slate-900/30 transition-all">
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-slate-200">{p.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-400">₹{p.price.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${p.stock < p.minOrderQty ? 'text-red-400' : 'text-emerald-400'}`}>
                            {p.stock} units
                          </span>
                          <span className="text-xs text-slate-500 ml-2">(MOQ: {p.minOrderQty})</span>
                          {p.stock < p.minOrderQty && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-bold">Sold Out</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteProduct(p._id)} className="bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-400 p-2 rounded-lg transition-all ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-8 text-slate-500">No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
