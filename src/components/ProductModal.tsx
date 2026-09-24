import {useDialog} from '../hooks/useDialog';
import React, { useState } from 'react';
import { X, Check, ShoppingBag, Truck, ShieldCheck, RefreshCw, Star, Zap, CreditCard, ArrowRight, Heart } from 'lucide-react';
import { api } from '../lib/api';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart, openCheckout } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]?.name
  );
  const [quantity, setQuantity] = useState(1);
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'specs' | 'care' | 'reviews'>('features');
  const [imageError, setImageError] = useState(false);

  useDialog('#product-modal-container',!!product,onClose,'Product details');
  if (!product) return null;

  const discountPercent = Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
  );

  const handleAddToCart = async () => {
    if (!await addToCart(product, quantity, selectedColor)) return;
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const handleInstantBuy = async () => {
    if (!await addToCart(product, quantity, selectedColor)) return;
    onClose();
    openCheckout();
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="product-modal-container"
        className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden border border-zinc-200 shadow-2xl my-4 sm:my-8 text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Image Stage & Gallery (5 cols) */}
          <div className="md:col-span-6 bg-gradient-to-b from-[#FBFBFA] to-zinc-100/70 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200">
            {/* Main Stage */}
            <div className="relative aspect-square rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-xs flex items-center justify-center overflow-hidden group">
              {!imageError && product.images[selectedImageIndex] ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-100 rounded-xl">
                  <span className="text-sm font-bold text-zinc-800">
                    {product.shortTitle}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">
                    Packshot
                  </span>
                </div>
              )}

              {/* Stock Badge Overlay */}
              <div className="absolute top-3 left-3 bg-zinc-950 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-2xs">
                {product.badge}
              </div>
            </div>

            {/* Thumbnails list */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageError(false);
                      setSelectedImageIndex(idx);
                    }}
                    className={`w-14 h-14 rounded-xl bg-white p-1 border overflow-hidden shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-zinc-950 ring-2 ring-zinc-950/20 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Reassurance bullets under photo */}
            <div className="mt-6 pt-4 border-t border-zinc-200/80 grid grid-cols-2 gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Express Pan-India Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>7-Day Replacement Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info, Actions, and Specifications (6 cols) */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category, Rating, and Urgency */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  {product.category}
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-1.5 text-xs text-amber-600 hover:underline cursor-pointer font-bold"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-zinc-500 font-normal">({product.reviewCount} reviews)</span>
                </button>
              </div>

              {/* Product Title */}
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-zinc-950 leading-snug">
                {product.title}
              </h2>

              {/* Pricing Row */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-display text-2xl sm:text-3xl font-black text-zinc-950">
                  ₹{product.price}
                </span>
                <span className="text-base text-zinc-400 line-through">
                  ₹{product.compareAtPrice}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Save ₹{product.compareAtPrice - product.price} ({discountPercent}% OFF)
                </span>
              </div>

              {/* Stock Urgency Indicator */}
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-amber-50/70 border border-amber-200/80 px-3 py-2 rounded-xl">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>
                  Available stock • {product.stockCount} units available for instant dispatch
                </span>
              </div>

              {/* Color variant picker (if present) */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800">Color Variant:</span>
                    <span className="text-zinc-500 font-medium">{selectedColor || product.colors[0].name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.colors.map((color, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          selectedColor === color.name || (!selectedColor && i === 0)
                            ? 'border-zinc-900 bg-zinc-50 text-zinc-950 font-bold ring-1 ring-zinc-900'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-zinc-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" className="text-xs underline" onClick={async () => { try { await api(`/wishlist/${product.id}`, "PUT"); setWishlistMessage("Saved to wishlist"); } catch (e) { setWishlistMessage((e as Error).message); } }}>Save to wishlist</button>
              {wishlistMessage && <p role="status" className="text-xs">{wishlistMessage}</p>}
              {/* Short Description */}
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {product.description}
              </p>

              {/* Tabs navigation: Features / Specs / Care / Reviews */}
              <div className="border-b border-zinc-200 flex gap-4 sm:gap-6 text-xs font-bold pt-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'features', label: 'Features' },
                  { id: 'specs', label: 'Specifications' },
                  { id: 'care', label: 'Care Guide' },
                  { id: 'reviews', label: `Reviews (${product.customerReviews.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2.5 transition-all whitespace-nowrap cursor-pointer relative ${
                      activeTab === tab.id
                        ? 'text-zinc-950 border-b-2 border-zinc-950'
                        : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="text-xs text-zinc-600 min-h-[140px]">
                {activeTab === 'features' && (
                  <ul className="space-y-2">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'specs' && (
                  <div className="divide-y divide-zinc-100">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1.5">
                        <span className="capitalize text-zinc-500 font-medium">{key}</span>
                        <span className="font-semibold text-zinc-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'care' && (
                  <ul className="space-y-2">
                    {product.careInstructions.map((care, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mt-1.5" />
                        <span>{care}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {!product.customerReviews.length && <p>No reviews yet.</p>}
                    {product.customerReviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">{rev.author}</span>
                          <span className="text-[10px] text-zinc-400">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, r) => (
                            <Star key={r} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-[10px] text-emerald-700 font-bold ml-1.5">
                            {rev.verified ? "Verified Purchase" : "Customer review"} ({rev.location})
                          </span>
                        </div>
                        <p className="font-semibold text-zinc-800 text-[11px]">{rev.title}</p>
                        <p className="text-zinc-600 text-[11px] leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity & High-Converting CTA Area */}
            <div className="pt-4 border-t border-zinc-200 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity adjuster */}
                <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-zinc-50 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2.5 text-zinc-700 hover:bg-zinc-200 font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-zinc-900 min-w-[2.2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(quantity + 1, product.colors?.find(c => c.name === selectedColor)?.stock || product.stockCount, 99))}
                    className="px-3.5 py-2.5 text-zinc-700 hover:bg-zinc-200 font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Cart */}
                <button
                  type="button"
                  id="modal-add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={added || !product.inStock}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag • ₹{product.price * quantity}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instant Buy Now Button */}
              <button
                type="button"
                id="modal-buy-now-btn"
                onClick={handleInstantBuy}
                disabled={!product.inStock}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <span>Buy Now with 1-Click • ₹{product.price * quantity}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Payment badges guarantee */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-400 pt-1">
                <span>✓ UPI / Google Pay / Cards</span>
                <span>•</span>
                <span>✓ Cash on Delivery</span>
                <span>•</span>
                <span>✓ 256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
