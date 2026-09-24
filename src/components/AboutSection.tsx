import React, {useEffect,useState} from 'react';
import {api} from '../lib/api';
import { Target, Layers, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const [stats,setStats]=useState({delivered:0,rating:0});
  useEffect(()=>{api('/stats').then(setStats).catch(()=>{});},[]);
  return (
    <section id="about-section" className="py-14 sm:py-20 bg-[#FAFAF8] border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Our Purpose & Craft
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            Why FAS ESSENTIALS?
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            Most kitchen and travel items are either cheaply made plastic junk that cracks in a month, or overpriced luxury goods with 400% brand markups. We set out to fix that.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          <div className="bg-white rounded-2xl p-7 border border-zinc-200 text-left space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Pristine Countertops & Frictionless Routine
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We design specifically to eliminate daily micro-frustrations: soggy sponges breeding bacteria on wet marble, oil bottles dripping grease onto shelves, or coffee going cold before you even finish morning chores.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-zinc-200 text-left space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Certified Materials, Zero Harmful Toxins
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Every item touches what you drink and eat. That’s why we exclusively specify certified 304 food-grade stainless steel, thick lead-free glass, and 100% BPA-free polymers that won't leach chemicals or foul smells.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-zinc-200 text-left space-y-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Direct-to-Consumer Honest Pricing
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              By removing third-party retail distributors, multi-level wholesalers, and expensive TV advertisements, we deliver commercial-grade items to Indian doorsteps at genuine direct factory rates.
            </p>
          </div>

        </div>

        {/* Fact Banner */}
        <div className="bg-zinc-950 rounded-3xl p-8 sm:p-10 text-white text-left grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div>
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-amber-400 block">
              {stats.delivered}
            </span>
            <span className="text-xs text-zinc-400 mt-1 block">Essentials Delivered</span>
          </div>
          <div>
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-white block">
              {stats.rating || "—"} / 5
            </span>
            <span className="text-xs text-zinc-400 mt-1 block">Average Buyer Rating</span>
          </div>
          <div>
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-white block">
              24–48h
            </span>
            <span className="text-xs text-zinc-400 mt-1 block">Pan-India Dispatch</span>
          </div>
          <div>
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-emerald-400 block">
              100%
            </span>
            <span className="text-xs text-zinc-400 mt-1 block">BPA-Free Food Grade</span>
          </div>
        </div>

      </div>
    </section>
  );
};
