import {useDialog} from '../hooks/useDialog';
import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, ArrowRight, Printer, CreditCard, Banknote, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { payOrder } from '../lib/payments';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    subtotal,
    discount,
    shipping,
    total,
    promoCode,
    orderNote,
    refreshCart
  } = useCart();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('cod');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {user,onlinePayments}=useAuth();
  const [receipt,setReceipt]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const checkoutKey=useRef(crypto.randomUUID());
  const orderNumber=receipt?.id || '';
  useEffect(()=>{if(isCheckoutOpen){checkoutKey.current=crypto.randomUUID();setIsSubmitted(false);setReceipt(null);setError('');setFullName(user?.name||'');setEmail(user?.email||'');}},[isCheckoutOpen]);

  useDialog('#checkout-modal-panel',isCheckoutOpen,()=>{if(!busy)closeCheckout();},'Checkout');
  if (!isCheckoutOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault(); if(busy) return; setBusy(true); setError('');
    try {
      const result=await api('/orders','POST',{checkoutKey:checkoutKey.current,address:{fullName,email,phone,address,city,state,postalCode},paymentMethod,orderNote});
      const confirmed=paymentMethod==='upi'?await payOrder(result.order,result.key):result.order;
      setReceipt(confirmed); setIsSubmitted(true); await refreshCart();
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  };

  const handleFinish = () => {
    refreshCart();
    setIsSubmitted(false);
    closeCheckout();
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={() => { if (!busy) closeCheckout(); }}
    >
      <div
        id="checkout-modal-panel"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 max-h-[90vh] flex flex-col text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-[#FAFAF8]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold block">
              FAS ESSENTIALS Express Checkout
            </span>
            <h3 className="font-display text-xl sm:text-2xl text-zinc-950 font-extrabold">
              {isSubmitted ? 'Order Confirmed!' : 'Review & Complete Order'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => { if (!busy) closeCheckout(); }}
            className="p-2 rounded-full text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/80 transition-colors cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {!isSubmitted ? (
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {error && <p role="alert" className="text-red-700">{error} <a href="#account" onClick={closeCheckout} className="underline">View orders</a></p>}
              {/* Order Summary Line Items */}
              <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold text-xs text-zinc-900 uppercase tracking-wider">
                    Order Items ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </p>
                  <span className="text-[11px] text-emerald-700 font-bold">24-48h Dispatch</span>
                </div>

                <div className="divide-y divide-zinc-200 max-h-40 overflow-y-auto pr-1 text-xs">
                  {items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-11 h-11 rounded-lg object-contain bg-white p-1 border border-zinc-200 shrink-0 mix-blend-multiply"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 line-clamp-1">{item.product.shortTitle}</p>
                          <p className="text-[11px] text-zinc-500">
                            Qty: {item.quantity} × ₹{item.product.price}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-zinc-950 shrink-0">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals */}
                <div className="pt-3 border-t border-zinc-200 space-y-1.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Code Applied ({promoCode})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Express Delivery</span>
                    <span>{shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-zinc-950 pt-2 border-t border-zinc-200">
                    <span>Total Amount</span>
                    <span className="text-base font-extrabold text-zinc-950">₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-4">
                <p className="font-display font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  1. Shipping & Contact Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="checkout-recipient-name" className="block text-zinc-700 font-bold mb-1">Recipient Name</label>
                    <input id="checkout-recipient-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-mobile-phone-for-delivery-sms-whatsapp" className="block text-zinc-700 font-bold mb-1">Mobile Phone (for delivery contact)</label>
                    <input id="checkout-mobile-phone-for-delivery-sms-whatsapp"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-email-address" className="block text-zinc-700 font-bold mb-1">Email Address</label>
                    <input id="checkout-email-address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-complete-delivery-address" className="block text-zinc-700 font-bold mb-1">Complete Delivery Address</label>
                    <input id="checkout-complete-delivery-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/flat no., building name, street"
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-city" className="block text-zinc-700 font-bold mb-1">City</label>
                    <input id="checkout-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-state" className="block text-zinc-700 font-bold mb-1">State</label>
                    <input id="checkout-state"
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-pin-code" className="block text-zinc-700 font-bold mb-1">PIN Code</label>
                    <input id="checkout-pin-code"
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-country" className="block text-zinc-700 font-bold mb-1">Country</label>
                    <input id="checkout-country"
                      type="text"
                      disabled
                      value="India"
                      className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-3">
                <p className="font-display font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  2. Select Payment Method
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      disabled={!onlinePayments}
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-zinc-950">
                        <CreditCard className="w-4 h-4 text-zinc-700" />
                        <span>UPI / Cards / NetBanking</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {onlinePayments ? "Pay securely with Razorpay. Confirmation follows server verification." : "Online payments are currently unavailable."}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-zinc-950">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <span>Cash on Delivery (COD)</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Pay cash directly to the courier agent upon doorstep delivery.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Note (if any) */}
              {orderNote && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                  <span className="font-bold text-zinc-700">Delivery Instructions:</span>{' '}
                  <span className="text-zinc-600">{orderNote}</span>
                </div>
              )}

              {/* Final Submit CTA Button */}
              <button
                type="submit"
                id="place-order-submit-button"
                disabled={busy || !items.length}
                className="w-full py-4 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
              >
                <span>{busy ? "Processing…" : `Confirm & Place Order • ₹${total}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Bank-Grade 256-bit Encryption
                </span>
                <span>•</span>
                <span>Secure checkout</span>
              </div>
            </form>
          ) : (
            /* Order Confirmation View */
            <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  Order Successfully Placed
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950">
                  Thank you, {fullName.split(' ')[0]}!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
                  Your order <strong className="text-zinc-900 font-mono font-bold">#{orderNumber}</strong> is confirmed. View order and tracking updates in your account.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-zinc-200 text-left text-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="font-bold text-zinc-900">Delivery Address:</span>
                  <span className="text-zinc-600 truncate max-w-[220px]">
                    {address}, {city}, {postalCode}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="font-bold text-zinc-900">Payment Method:</span>
                  <span className="font-semibold text-zinc-800 uppercase">
                    {paymentMethod === 'upi' ? 'Online UPI / Card (Prepaid)' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="font-bold text-zinc-900">Order Total:</span>
                  <span className="font-extrabold text-zinc-950 text-sm">₹{(receipt?.total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-900">Estimated Delivery:</span>
                  <span className="text-emerald-700 font-bold">2 to 4 Business Days</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
