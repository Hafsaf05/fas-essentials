import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, Sparkles, Star, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface HeroProps {
  products: Product[];
  onShopClick: () => void;
  onOpenProduct: (id: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ products, onShopClick, onOpenProduct }) => {
  const { addToCart } = useCart();
  // Allow user to switch featured spotlight between top products
  const [activeProductIndex, setActiveProductIndex] = useState(4); // Default to the viral 1200ml Tumbler or 3-in-1 Soap Dispenser
  const [quickAdded, setQuickAdded] = useState(false);

  const product = products[activeProductIndex] || products[0];

  if (!product) return null;
  const handleHeroQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!await addToCart(product, 1)) return;
    setQuickAdded(true);
    setTimeout(() => setQuickAdded(false), 1500);
  };

  return (
    <section
      id="hero-section"
      className="relative bg-gradient-to-b from-[#FAFAF8] via-[#F6F6F2] to-[#FAFAF8] border-b border-zinc-200/80 overflow-hidden"
    >
      {/* Subtle architectural background grid accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#E4E4E7_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Premium Value Proposition */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-2xs text-xs font-semibold text-zinc-800">
              <span className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </span>
              <span className="text-zinc-900 font-bold">{products.reduce((n,p)=>n+p.reviewCount,0)} reviews</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-600">From delivered customer orders</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 leading-[1.12]">
                Everyday essentials, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-800 to-amber-700">
                  engineered for real utility.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl font-normal">
                No fragile gimmicks. No middlemen markups. Thoughtfully crafted kitchenware and thermal hydration essentials that keep countertops dry, coffee steaming hot, and daily routines running effortlessly.
              </p>
            </div>

            {/* Proof & Guarantees Strip */}
            <div className="pt-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-700 font-medium">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-zinc-200/60">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Free Express &gt; ₹499</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-zinc-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>7-Day Replacement</span>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-zinc-200/60">
                <CheckCircle2 className="w-4 h-4 text-zinc-800 shrink-0" />
                <span>100% Food-Safe Build</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                id="hero-shop-button"
                onClick={onShopClick}
                className="px-7 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold tracking-wide transition-all shadow-sm hover:shadow-md flex items-center gap-2.5 cursor-pointer group"
              >
                <span>Shop All Essentials</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onOpenProduct(product.id)}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 hover:border-zinc-400 text-sm font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <span>View Spotlight Spec</span>
                <span className="text-xs text-amber-700 font-bold">₹{product.price}</span>
              </button>
            </div>

            {/* Mini Selector Tabs */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-2">
                Featured Spotlight (Click to switch):
              </span>
              <div className="flex flex-wrap gap-2">
                {products.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProductIndex(idx)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeProductIndex === idx
                        ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-2xs'
                        : 'bg-white text-zinc-600 hover:text-zinc-900 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {p.shortTitle.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Hero Spotlight Interactive Card */}
          <div className="lg:col-span-5">
            <div
              id="hero-product-spotlight"
              onClick={() => onOpenProduct(product.id)}
              className="bg-white rounded-3xl border border-zinc-200 shadow-xl p-5 sm:p-6 text-left relative overflow-hidden group hover:border-zinc-400 transition-all duration-300 cursor-pointer"
            >
              {/* Top Banner Row */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  {product.badge}
                </span>

                <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-zinc-400 font-normal">({product.reviewCount})</span>
                </div>
              </div>

              {/* Product Packshot Canvas */}
              <div className="relative aspect-square rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100/80 p-6 flex items-center justify-center overflow-hidden border border-zinc-100">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Stock Urgency Tag */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-zinc-200 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-700 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{product.inStock ? 'In Stock • Ready to ship' : 'Currently unavailable'}</span>
                </div>
              </div>

              {/* Product Info Block */}
              <div className="pt-4 space-y-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
                    {product.category}
                  </span>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-950 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {product.shortTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                    {product.headline}
                  </p>
                </div>

                {/* Price & Savings Pill */}
                <div className="flex items-baseline justify-between pt-1 border-t border-zinc-100">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-black text-zinc-950">
                      ₹{product.price}
                    </span>
                    <span className="text-xs text-zinc-400 line-through">
                      ₹{product.compareAtPrice}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Save ₹{product.compareAtPrice - product.price}
                  </span>
                </div>

                {/* Key Benefit Highlights */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-600 pt-1">
                  {product.highlights.slice(0, 2).map((h, i) => (
                    <div key={i} className="flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3 h-3 text-zinc-800 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Add CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleHeroQuickAdd}
                    disabled={quickAdded || !product.inStock}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                      quickAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    {quickAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag • ₹{product.price}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
