import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, ThumbsUp, MessageSquare, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { Product } from '../types';
import { CustomerReview } from '../types';

export const CustomerReviewsSection: React.FC<{products:Product[]}> = ({products}) => {
  const [reviews, setReviews] = useState<(CustomerReview & {productName:string})[]>([]);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{api('/reviews').then(setReviews).catch(e=>setError(e.message));},[]);
  const [selectedFilter, setSelectedFilter] = useState<number | 'all'>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New review form states
  const [newAuthor, setNewAuthor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.rating === selectedFilter;
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();setBusy(true);setError('');
    try{const data=await api('/reviews','POST',{productId:newProduct||products[0]?.id,author:newAuthor,location:newLocation,rating:newRating,title:newTitle,comment:newComment});setReviews(data);setSubmitted(true);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };

  return (
    <section id="reviews-section" className="py-14 sm:py-20 bg-white border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Real Customer Experiences</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            Customer Reviews
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base">
            Honest, verified reviews from daily users across India who upgraded their kitchen and hydration routines with FAS ESSENTIALS.
          </p>
        </div>

        {/* Rating Breakdown & Overall Score Card */}
        <div className="bg-[#FAFAF8] rounded-3xl border border-zinc-200 p-6 sm:p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Overall Score */}
            <div className="md:col-span-4 text-center md:text-left md:border-r border-zinc-200 md:pr-8 space-y-2">
              <span className="font-display text-5xl sm:text-6xl font-black text-zinc-950 block">
                {reviews.length ? (reviews.reduce((n,r)=>n+r.rating,0)/reviews.length).toFixed(1) : "—"}
              </span>
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Based on {reviews.length} verified purchaser reviews
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>

            {/* Bars Breakdown */}
            <div className="md:col-span-8 space-y-2 text-xs">
              {[5,4,3,2,1].map(stars=>({stars,pct:reviews.length?Math.round(reviews.filter(r=>r.rating===stars).length/reviews.length*100):0})).map((row) => (
                <div key={row.stars} className="flex items-center gap-3">
                  <span className="w-12 text-zinc-600 font-medium flex items-center gap-1 justify-end">
                    <span>{row.stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-zinc-400 text-right font-mono">
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All Ratings ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(5)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 5
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              5-Star Only ★
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(4)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 4
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              4-Star ★
            </button>
          </div>
          <span className="text-xs text-zinc-400">
            Showing {filteredReviews.length} testimonials
          </span>
        </div>

        {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
        {!reviews.length && <p className="py-4 text-zinc-500">No reviews yet. Customers can review after delivery.</p>}
        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-[#FAFAF8] rounded-2xl border border-zinc-200/90 p-6 flex flex-col justify-between space-y-4 text-left hover:border-zinc-300 transition-all shadow-2xs"
            >
              <div className="space-y-2.5">
                {/* Product Eyebrow */}
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-zinc-200">
                  <span className="font-semibold text-zinc-700 truncate max-w-[200px]">
                    {review.productName}
                  </span>
                  <span className="text-zinc-400 shrink-0">{review.date}</span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Review Headline */}
                <h4 className="font-display font-bold text-sm text-zinc-950">
                  "{review.title}"
                </h4>

                {/* Body Comment */}
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {review.comment}
                </p>
              </div>

              {/* Author and Verification Badge */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 text-xs">
                <div>
                  <span className="font-bold text-zinc-900 block">{review.author}</span>
                  <span className="text-[11px] text-zinc-400">{review.location}</span>
                </div>
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Write a Review Modal */}
        {isWriteModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsWriteModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-lg w-full p-6 text-left border border-zinc-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <h3 className="font-display text-lg font-bold text-zinc-950">
                  Write a Verified Review
                </h3>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-zinc-900 text-base">Thank You for Your Feedback!</h4>
                  <p className="text-xs text-zinc-500">Your review has been verified and published.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">{error && <p role="alert" className="text-red-700">{error}</p>}
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Product</label>
                    <select
                      value={newProduct || products[0]?.id || ""}
                      onChange={(e) => setNewProduct(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.shortTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-zinc-800 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-800 mb-1">City, State</label>
                      <input
                        type="text"
                        required
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g. Pune, Maharashtra"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewRating(s)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= newRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-bold text-zinc-700 ml-2">{newRating} Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Headline</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Outstanding quality and finish"
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Detailed Review</label>
                    <textarea
                      rows={3}
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="How has this item helped your daily routine?"
                      className="w-full p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 resize-none"
                    />
                  </div>

                  <button
                    type="submit" disabled={busy}
                    className="w-full py-3 rounded-xl bg-zinc-950 text-white font-bold uppercase tracking-wider text-xs hover:bg-zinc-800 transition-all cursor-pointer"
                  >
                    Submit Verified Review
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
