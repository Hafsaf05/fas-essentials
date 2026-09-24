import { fetchProducts } from '../lib/products';
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SortOption } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowUpDown, SlidersHorizontal, Sparkles, Filter, Star } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  onOpenProductModal: (product: Product) => void;
  selectedCategory?: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onOpenProductModal,
  selectedCategory: initialCategory = 'All'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...cats];
  }, [products]);

  const [filteredAndSortedProducts,setFiltered]=useState(products),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  useEffect(()=>{let alive=true;setLoading(true);fetchProducts('?'+new URLSearchParams({category:selectedCategory==='All'?'':selectedCategory,sort:sortBy})).then(data=>{if(alive){setFiltered(data);setError('');}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[selectedCategory,sortBy,products]);

  return (
    <section id="catalog-section" className="py-12 sm:py-16 bg-[#FAFAF8] border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-zinc-200 gap-6 text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Store Catalog</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 tracking-tight">
              Essential Tools for Everyday Living
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 max-w-xl font-normal">
              Practical, high-utility items designed for durability, ease of cleaning, and everyday convenience.
            </p>
          </div>

          {/* Filter / Sort Bar */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-700" />
              <span>Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold bg-white border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 focus:outline-hidden focus:border-zinc-800 shadow-2xs cursor-pointer"
            >
              <option value="featured">Featured Essentials</option>
              <option value="rating">Highest Customer Rating ★</option>
              <option value="price-asc">Price: Low to High (₹)</option>
              <option value="price-desc">Price: High to Low (₹)</option>
              <option value="discount">Biggest Discount (%)</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Count Bar */}
        <div className="flex flex-wrap items-center justify-between py-6 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/90 hover:border-zinc-300 shadow-2xs'
                }`}
              >
                {cat === 'All' ? `All Items (${products.length})` : cat}
              </button>
            ))}
          </div>

          <span className="text-xs font-medium text-zinc-400">
            Showing {filteredAndSortedProducts.length} essentials
          </span>
        </div>

        {loading && <p role="status">Loading products…</p>}{error && <p role="alert" className="text-red-700">{error}</p>}{!loading && !error && !filteredAndSortedProducts.length && <p className="py-8 text-zinc-500">No products are available in this category yet.</p>}
        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={onOpenProductModal}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
