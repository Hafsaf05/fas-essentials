import {useDialog} from '../hooks/useDialog';
import { fetchProducts } from '../lib/products';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, Star, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface SearchModalProps {
  products: Product[];
  onOpenProductModal: (product: Product) => void;
}

const POPULAR_SEARCHES = [
  'Stainless Steel Tumbler 1200ml',
  '3-in-1 Soap Dispenser',
  'Glass Oil Sprayer 500ml',
  'LED Coffee Mug',
  'Mini Tumbler'
];

export const SearchModal: React.FC<SearchModalProps> = ({ products, onOpenProductModal }) => {
  const { isSearchOpen, closeSearch, openSearch } = useCart();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSearchOpen) closeSearch(); else openSearch();
      }
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  const [matchingProducts,setMatching]=useState<Product[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let alive=true;if(!query.trim()){setMatching([]);setLoading(false);return;}setLoading(true);const timer=setTimeout(()=>{fetchProducts('?'+new URLSearchParams({q:query})).then(p=>{if(alive){setMatching(p);setError('');}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});},250);return()=>{alive=false;clearTimeout(timer);};},[query]);

  useDialog('#search-modal-panel',isSearchOpen,closeSearch,'Search catalog');
  if (!isSearchOpen) return null;

  const handleSelectProduct = (product: Product) => {
    closeSearch();
    onOpenProductModal(product);
  };

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={closeSearch}
    >
      <div
        id="search-modal-panel"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center gap-3 bg-[#FAFAF8]">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search essentials (e.g. oil sprayer, tumbler, mug)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-zinc-950 placeholder-zinc-400 focus:outline-hidden font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-800 px-2 py-1 rounded-md cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/80 transition-colors cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Suggestions */}
        {!query.trim() && (
          <div className="p-6">
            <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-3">
              Popular Everyday Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {products.slice(0,5).map(p=>p.shortTitle).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <p role="status" className="p-4">Searching…</p>}{error && <p role="alert" className="p-4 text-red-700">{error}</p>}
        {/* Search Results List */}
        {query.trim() && (
          <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-zinc-500 mb-3 font-medium">
              {matchingProducts.length} {matchingProducts.length === 1 ? 'item' : 'items'} found for "{query}"
            </p>

            {matchingProducts.length > 0 ? (
              <div className="space-y-2">
                {matchingProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="flex items-center gap-4 p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200/80 transition-colors cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-b from-[#FAFAF8] to-zinc-100 p-1 flex items-center justify-center border border-zinc-200">
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-zinc-950 group-hover:text-amber-800 transition-colors line-clamp-1">
                          {p.shortTitle}
                        </h4>
                        <span className="text-xs font-extrabold text-zinc-950 ml-2">
                          ₹{p.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                        <span>{p.category}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">Save ₹{p.compareAtPrice - p.price}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {p.rating}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-1">
                <p className="font-bold text-sm text-zinc-900">
                  No matching essentials found
                </p>
                <p className="text-xs text-zinc-500">
                  Try searching for "Soap", "Oil", "Tumbler", or "Mug".
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
