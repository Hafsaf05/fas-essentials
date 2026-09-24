import React, { useState } from 'react';
import { ShoppingBag, Eye, Check, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const discountPercent = Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
  );

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!await addToCart(product, 1)) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onOpenDetails(product)}
      className="group bg-white rounded-2xl border border-zinc-200/90 overflow-hidden flex flex-col hover:border-zinc-400 hover:shadow-lg transition-all duration-300 cursor-pointer text-left relative"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square bg-gradient-to-b from-[#FBFBFA] to-zinc-100/70 p-6 flex items-center justify-center overflow-hidden border-b border-zinc-100">
        {/* Top Badges: Discount & Stock */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-md bg-zinc-950 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
            {product.badge || `${discountPercent}% OFF`}
          </span>

          {product.stockCount > 0 && product.stockCount <= 10 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
              Only {product.stockCount} left
            </span>
          )}
        </div>

        {/* Product Image */}
        {!imageError && product.images && product.images.length > 0 ? (
          <img
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-106 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-200/80 rounded-xl border border-zinc-300">
            <span className="text-xs font-semibold text-zinc-800 line-clamp-2">
              {product.shortTitle}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-medium">
              Packshot
            </span>
          </div>
        )}

        {/* Image thumbnail hover dots if product has multiple images */}
        {product.images.length > 1 && (
          <div
            className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {product.images.slice(0, 4).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setActiveImageIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeImageIndex === idx ? 'w-4 bg-zinc-950' : 'bg-zinc-300 hover:bg-zinc-400'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Quick Actions Hover Drawer (Desktop) */}
        <div className="absolute inset-x-3 bottom-3 hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-20">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={added || !product.inStock}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{product.inStock ? 'Quick Add' : 'Out of stock'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
            className="p-2.5 rounded-xl bg-white/95 hover:bg-white text-zinc-900 border border-zinc-200 shadow-sm transition-all hover:scale-105 cursor-pointer"
            title="Inspect full product specs"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Category & Star Rating Row */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-zinc-800 font-bold">{product.rating}</span>
              <span className="text-zinc-400">({product.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-sm sm:text-base text-zinc-950 line-clamp-2 group-hover:text-amber-800 transition-colors leading-snug">
            {product.title}
          </h3>

          {/* Color Variant Indicators (if available) */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              <span className="text-[10px] text-zinc-400 font-medium mr-1">Colors:</span>
              {product.colors.map((c, i) => (
                <span
                  key={i}
                  title={c.name}
                  className="w-2.5 h-2.5 rounded-full border border-zinc-300"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Price & Savings Block */}
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg sm:text-xl font-extrabold text-zinc-950">
                ₹{product.price}
              </span>
              <span className="text-xs text-zinc-400 line-through">
                ₹{product.compareAtPrice}
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Save ₹{product.compareAtPrice - product.price}
            </span>
          </div>

          {/* Top Feature Snippet */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-500 line-clamp-1">
            <CheckCircle2 className="w-3 h-3 text-zinc-700 shrink-0" />
            <span className="truncate">{product.features[0]}</span>
          </div>

          {/* Mobile Persistent Quick Add Button */}
          <div className="sm:hidden pt-1">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={added || !product.inStock}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-950 text-white active:bg-zinc-800'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Bag • ₹{product.price}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
