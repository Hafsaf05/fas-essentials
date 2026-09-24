import {useDialog} from '../hooks/useDialog';
import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Truck, CheckCircle2, Tag, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    error, busy, saveNote,
    items,
    itemCount,
    subtotal,
    discount,
    shipping,
    total,
    freeShippingThreshold,
    amountToFreeShipping,
    isFreeShipping,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    openCheckout,
    promoCode,
    promoError,
    applyPromoCode,
    removePromoCode,
    orderNote,
    setOrderNote
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  useDialog('#cart-drawer-panel',isCartOpen,closeCart,'Shopping bag');
  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = await applyPromoCode(couponInput);
    if (success) setCouponInput('');
  };

  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  // Calculate total original compare price
  const originalSubtotal = items.reduce(
    (acc, item) => acc + item.product.compareAtPrice * item.quantity,
    0
  );
  const totalSavings = originalSubtotal - (subtotal - discount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between text-left border-l border-zinc-200"
        >
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-zinc-950" />
              <h2 className="font-display text-base font-extrabold text-zinc-950">
                Your Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-2 rounded-full text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/80 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && <p role="alert" className="p-4 text-red-700">{error}</p>}
          {/* Free Shipping Progress Indicator */}
          <div className="bg-amber-50/70 px-6 py-3 border-b border-amber-200/60 text-xs">
            {isFreeShipping ? (
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>🎉 Congratulations! You unlocked FREE Express Delivery</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-zinc-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5 text-amber-700" />
                    Add <strong className="text-zinc-950 font-bold">₹{amountToFreeShipping}</strong> more for FREE shipping
                  </span>
                  <span className="font-bold text-zinc-900">{freeShippingProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-950 rounded-full transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-14 h-14 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-zinc-900">Your bag is empty</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Upgrade your home & kitchen routines with our durable essentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-3 text-left">
                  {/* Thumbnail */}
                  <div className="w-18 h-18 rounded-xl bg-gradient-to-b from-[#FAFAF8] to-zinc-100 p-2 border border-zinc-200 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-contain mix-blend-multiply"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-display text-xs font-bold text-zinc-900 line-clamp-2 leading-snug">
                      {item.product.shortTitle} — {item.selectedColor}
                    </h4>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-zinc-950">
                        ₹{item.product.price}
                      </span>
                      <span className="text-[11px] text-zinc-400 line-through">
                        ₹{item.product.compareAtPrice}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Save ₹{item.product.compareAtPrice - item.product.price}
                      </span>
                    </div>

                    {/* Quantity & Delete */}
                    <div className="flex items-center justify-between pt-1.5">
                      <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-zinc-50 text-xs shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-zinc-700 hover:bg-zinc-200 transition-colors font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 font-bold text-zinc-900 min-w-[1.6rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-zinc-700 hover:bg-zinc-200 transition-colors font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Controls */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-200 bg-white space-y-4">
              
              {/* Savings Announcement */}
              {totalSavings > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Total Savings on this Order:
                  </span>
                  <span>₹{totalSavings}</span>
                </div>
              )}

              {/* Promo Code Box */}
              <div>
                {promoCode ? (
                  <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      Coupon "{promoCode}" applied (-₹{discount})
                    </span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-amber-800 hover:text-amber-950 text-[11px] underline font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Discount code (e.g. FAS10)"
                        className="flex-1 text-xs border border-zinc-300 rounded-xl px-3 py-2 uppercase placeholder:normal-case focus:outline-hidden focus:border-zinc-800 bg-zinc-50"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>Try code:</span>
                      <button
                        type="button"
                        onClick={() => applyPromoCode('FAS10')}
                        className="font-bold underline text-zinc-800 hover:text-amber-700 cursor-pointer"
                      >
                        FAS10 (10% off)
                      </button>
                    </div>
                  </div>
                )}
                {promoError && (
                  <p className="text-[11px] text-red-600 mt-1">{promoError}</p>
                )}
              </div>

              {/* Order Notes Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowNoteField(!showNoteField)}
                  className="text-xs text-zinc-600 hover:text-zinc-950 underline font-medium cursor-pointer"
                >
                  {showNoteField ? 'Hide special delivery note' : '+ Add delivery instructions'}
                </button>
                {showNoteField && (
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="e.g. Please ring doorbell or leave at front door"
                    className="w-full text-xs border border-zinc-300 rounded-xl p-2.5 mt-1.5 focus:outline-hidden focus:border-zinc-800 bg-zinc-50 resize-none"
                  />
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-zinc-900">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping & Handling</span>
                  <span className="font-bold text-zinc-900">
                    {shipping === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE Express</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-zinc-950 pt-2 border-t border-zinc-100">
                  <span>Total Amount</span>
                  <span className="text-lg">₹{total}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                id="drawer-checkout-button"
                disabled={busy}
                onClick={async () => { if (await saveNote()) openCheckout(); }}
                className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
              >
                <span>Proceed to Checkout • ₹{total}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  SSL Encrypted
                </span>
                <span>•</span>
                <span>COD Available</span>
                <span>•</span>
                <span>7-Day Replacement</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
