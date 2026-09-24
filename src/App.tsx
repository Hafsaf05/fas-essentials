import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { fetchProducts } from './lib/products';
import { AuthProvider } from './context/AuthContext';
import { Account } from './components/Account';
import { AdminEntry } from './components/AdminEntry';
import { Product } from './types';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header, NavView } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { TrustBadgesSection } from './components/TrustBadgesSection';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { AboutSection } from './components/AboutSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { SearchModal } from './components/SearchModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PolicyModal } from './components/PolicyModal';

function StorefrontContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const { error: cartError } = useCart();
  useEffect(() => { const change = () => setCurrentView((window.location.hash.slice(1).split('?')[0] || 'home') as NavView); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<NavView>((window.location.hash.slice(1).split('?')[0] || 'home') as NavView);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);

  const {
    selectedProduct,
    openProductModal,
    closeProductModal
  } = useCart();

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setCatalogError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
    window.addEventListener('store:changed',loadCatalog);
    return () => window.removeEventListener('store:changed',loadCatalog);
  }, []);

  const handleNavigate = (view: NavView) => {
    window.location.hash = view;
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProductById = (id: string) => {
    const p = products.find((prod) => prod.id === id);
    if (p) {
      openProductModal(p);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-zinc-900 font-sans selection:bg-amber-100 selection:text-zinc-900">
      {/* Top Announcement Bar with rotating notices and promo coupon */}
      <AnnouncementBar onNavigateToCatalog={() => handleNavigate('catalog')} />

      {/* Main Navigation Header */}
      <Header currentView={currentView} onNavigate={handleNavigate} />

      {/* Main View Router */}
      <main className="flex-1">
        {cartError && <p role="alert" className="p-4 bg-amber-50 text-amber-900">{cartError}</p>}
        {loading && <p role="status" className="p-6 text-center">Loading store…</p>}
        {catalogError && <p role="alert" className="p-6 text-center text-red-700">{catalogError} <button className="underline" onClick={() => window.location.reload()}>Retry</button></p>}
        {["account","orders","login","signup"].includes(currentView) && <Account key={currentView} view={currentView} />}
        {currentView === 'home' && (
          <>
            {/* 1. Hero Section with Interactive Spotlight & Direct Add to Bag */}
            <Hero
              products={products}
              onShopClick={() => handleNavigate('catalog')}
              onOpenProduct={handleOpenProductById}
            />

            {/* 2. Trust Assurance Grid */}
            <TrustBadgesSection />

            {/* 3. Product Catalog Grid (All 5 Authentic Essentials) */}
            <ProductCatalog
              products={products}
              onOpenProductModal={openProductModal}
            />

            {/* 4. Verified Customer Reviews & Testimonials Section */}
            <CustomerReviewsSection products={products} />

            {/* 5. About FAS ESSENTIALS Philosophy Section */}
            <AboutSection />

            {/* 6. Interactive FAQ Accordion */}
            <FaqSection onContactClick={() => handleNavigate('contact')} />

            {/* 7. Customer Support & Contact Section */}
            <ContactSection />
          </>
        )}

        {currentView === 'catalog' && (
          <div className="py-4 animate-in fade-in duration-200">
            <ProductCatalog
              products={products}
              onOpenProductModal={openProductModal}
            />
            <TrustBadgesSection />
          </div>
        )}

        {currentView === 'reviews' && (
          <div className="py-4 animate-in fade-in duration-200">
            <CustomerReviewsSection products={products} />
            <TrustBadgesSection />
          </div>
        )}

        {currentView === 'about' && (
          <div className="py-4 animate-in fade-in duration-200">
            <AboutSection />
            <TrustBadgesSection />
          </div>
        )}

        {currentView === 'faq' && (
          <div className="py-4 animate-in fade-in duration-200">
            <FaqSection onContactClick={() => handleNavigate('contact')} />
            <TrustBadgesSection />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="py-6 animate-in fade-in duration-200">
            <ContactSection />
            <FaqSection onContactClick={() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" })} />
          </div>
        )}
      </main>

      {/* Comprehensive Brand Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenPolicy={(policy) => setActivePolicy(policy)}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />

      {/* High-Converting Product Details Modal */}
      <ProductModal
        key={selectedProduct?.id || "none"}
        product={selectedProduct}
        onClose={closeProductModal}
      />

      {/* Instant Search Overlay */}
      <SearchModal
        products={products}
        onOpenProductModal={openProductModal}
      />

      {/* Express Checkout Modal with UPI & COD */}
      <CheckoutModal />

      {/* Legal & Policies Modal */}
      <PolicyModal
        policy={activePolicy}
        onClose={() => setActivePolicy(null)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>{/^\/admin(?:\/|$)/.test(window.location.pathname)?<AdminEntry/>:<CartProvider>
      <StorefrontContent />
    </CartProvider>}</AuthProvider>
  );
}

export default App;
