import { api } from '../lib/api';
import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, Truck, RefreshCw, ArrowRight, Heart } from 'lucide-react';
import { NavView } from './Header';

interface FooterProps {
  onNavigate: (view: NavView) => void;
  onOpenPolicy: (policy: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenPolicy }) => {
  const [email, setEmail] = useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setError(''); try { await api('/newsletter','POST',{email}); setSubscribed(true); } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  };

  return (
    <footer id="main-footer" className="bg-zinc-950 text-zinc-300 border-t border-zinc-800">
      {/* Service Highlights Bar */}
      <div className="border-b border-zinc-800/80 py-8 px-4 sm:px-6 lg:px-8 bg-zinc-900/40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Free Delivery</p>
              <p className="text-[11px] text-zinc-400">On all prepaid & COD orders above ₹499</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Quality Certified</p>
              <p className="text-[11px] text-zinc-400">100% Food-Grade BPA-Free & 304 Stainless</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">7-Day Replacement</p>
              <p className="text-[11px] text-zinc-400">Instant exchange on any damaged or defective pieces</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 text-left">
          
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <div className="space-y-1">
              <span className="font-display text-xl font-extrabold text-white tracking-tight block">
                FAS ESSENTIALS
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">
                Everyday Home & Kitchen Essentials
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              We design and manufacture everyday utility tools that eliminate countertop friction, soggy sponges, and lukewarm drinks. Honest direct-to-consumer value without distributor markups.
            </p>
            <div className="text-xs text-zinc-500 pt-1">
              <span>Support: </span>
              <a href="mailto:support@fasessentials.in" className="text-zinc-300 hover:underline">
                support@fasessentials.in
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { id: 'home', label: 'Home' },
                { id: 'catalog', label: 'Shop Catalog' },
                { id: 'reviews', label: 'Verified Reviews' },
                { id: 'about', label: 'Why FAS?' },
                { id: 'faq', label: 'Help & FAQs' },
                { id: 'contact', label: 'Contact Us' }
              ].map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id as NavView)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest">
              Policies
            </h4>
            <ul className="space-y-2 text-xs">
              {['refund', 'shipping', 'privacy', 'terms'].map((policy) => (
                <li key={policy}>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy(policy)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer capitalize"
                  >
                    {policy} Policy
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe to our emails */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-widest">
              Direct Community Offers
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get secret promotional codes, early-access restock alerts, and functional home tips.
            </p>

            {error && <p role="alert" className="text-red-400">{error}</p>}
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold py-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're subscribed. Your welcome email is queued.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for 10% coupon"
                    className="flex-1 min-w-0 bg-zinc-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-zinc-800 focus:outline-hidden focus:border-zinc-500 placeholder-zinc-500"
                  />
                  <button
                    type="submit"
                  disabled={busy}
                    className="bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
                  >
                    Join
                  </button>
                </div>
              </form>
            )}

            <p className="text-[10px] text-zinc-500">
              Zero spam. Unsubscribe anytime with 1-click.
            </p>
          </div>
        </div>

        {/* Bottom Copyright & Notes */}
        <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <p>© {new Date().getFullYear()} FAS ESSENTIALS. Built for Daily Living.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Pan-India Fulfillment</span>
            <span>•</span>
            <span>Food-Grade Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
