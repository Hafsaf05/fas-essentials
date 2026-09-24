import React, { useState, useEffect } from 'react';
import { Truck, Sparkles, ShieldCheck, Tag, ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  onNavigateToCatalog: () => void;
}

const MESSAGES = [
  {
    icon: <Truck className="w-3.5 h-3.5 text-amber-400" />,
    text: 'Free Express Delivery across India on orders above ₹499'
  },
  {
    icon: <Tag className="w-3.5 h-3.5 text-amber-400" />,
    text: 'Special Launch Offer: Use code FAS10 for 10% OFF at checkout'
  },
  {
    icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
    text: '7-Day Hassle-Free Replacement • 100% Food-Grade Certified'
  }
];

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onNavigateToCatalog }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      id="announcement-banner"
      aria-label="Store Announcement"
      className="bg-zinc-950 text-zinc-100 text-xs py-2 px-4 border-b border-zinc-800 transition-colors"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left benefit message (cycle) */}
        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2 overflow-hidden transition-all duration-300">
          <span className="shrink-0">{MESSAGES[currentIdx].icon}</span>
          <span className="font-medium text-[11px] sm:text-xs text-zinc-200 tracking-tight line-clamp-1">
            {MESSAGES[currentIdx].text}
          </span>
        </div>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] shrink-0">
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <span>Shop All Essentials</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
};
