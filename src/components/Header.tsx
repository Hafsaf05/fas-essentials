import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export type NavView = 'home' | 'catalog' | 'reviews' | 'about' | 'faq' | 'contact' | 'account' | 'orders' | 'login' | 'signup';

interface HeaderProps {
  currentView: NavView;
  onNavigate: (view: NavView, category?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const {user,logout}=useAuth();
  const [error,setError]=useState('');
  const links=user?[{id:'account',label:'My Account'},{id:'orders',label:'My Orders'},{id:'logout',label:'Logout'}]:[{id:'login',label:'Login'},{id:'signup',label:'Signup'}];
  const { itemCount, openCart, openSearch } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (view: NavView | 'logout') => {
    if(view==='logout'){void logout().then(()=>handleNavClick('login')).catch(e=>setError(e.message));return;}
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-40 w-full transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-zinc-200/80 shadow-xs'
          : 'bg-[#FAFAF8] border-zinc-200/70'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Mobile Menu Trigger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              id="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 text-zinc-700 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Mark / Logo */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="group text-left cursor-pointer flex flex-col"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-zinc-950 group-hover:text-zinc-700 transition-colors">
                  FAS ESSENTIALS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 hidden sm:inline-block"></span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold -mt-1 hidden sm:block">
                Modern Daily Utility
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            id="desktop-navigation"
            className="hidden lg:flex items-center space-x-1 sm:space-x-2"
            aria-label="Main Navigation"
          >
            {links.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id as NavView)}
                className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer relative ${
                  currentView === item.id
                    ? 'text-zinc-950 bg-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons: Search & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger with shortcut badge */}
            <button
              type="button"
              id="search-trigger-button"
              onClick={openSearch}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer text-xs"
              aria-label="Search catalog"
              title="Search products (Cmd+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-medium text-zinc-500">
                Search
              </span>
              <kbd className="hidden md:inline-block text-[10px] bg-white border border-zinc-300 text-zinc-500 px-1.5 py-0.5 rounded font-mono shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Slide-out Cart Trigger */}
            <button
              type="button"
              id="cart-drawer-trigger"
              onClick={openCart}
              className="relative p-2 sm:px-3.5 sm:py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs group"
              aria-label={`View cart (${itemCount} items)`}
            >
              <ShoppingBag className="w-4 h-4 text-zinc-200 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden sm:inline">Bag</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[11px] font-bold">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {error&&<p role="alert">{error}</p>}
      {/* Mobile Menu Slide-down Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200 shadow-xl"
        >
          <div className="grid grid-cols-2 gap-2 pt-2">
            {links.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id as NavView)}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  currentView === item.id
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Pan-India 48h Dispatch
            </span>
            <span className="text-zinc-400">COD & UPI Available</span>
          </div>
        </div>
      )}
    </header>
  );
};
