import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export const TrustBadgesSection: React.FC = () => {
  return (
    <section id="trust-section" className="py-12 bg-white border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAFAF8] border border-zinc-200/70 text-left">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-950">
                Free Express Delivery
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Free delivery on all orders above ₹499. Orders are packed and dispatched in 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAFAF8] border border-zinc-200/70 text-left">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-950">
                7-Day Easy Replacement
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Received a damaged or defective piece? We replace it immediately with zero hassle.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAFAF8] border border-zinc-200/70 text-left">
            <div className="w-11 h-11 rounded-xl bg-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-950">
                100% Food-Grade Build
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                All plastics are BPA-free and metals use 304 food-grade stainless steel tested for daily durability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAFAF8] border border-zinc-200/70 text-left">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-950">
                Secure COD & UPI
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Pay on delivery or enjoy seamless one-tap UPI, cards, and net banking with 256-bit encryption.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
