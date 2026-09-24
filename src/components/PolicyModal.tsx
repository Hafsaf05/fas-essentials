import React from 'react';
import { X, ShieldCheck, Truck, RefreshCw, FileText } from 'lucide-react';

interface PolicyModalProps {
  policy: string | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policy, onClose }) => {
  if (!policy) return null;

  const getPolicyContent = () => {
    switch (policy) {
      case 'refund':
        return {
          title: 'Refund & Replacement Policy',
          icon: <RefreshCw className="w-5 h-5 text-neutral-800" />,
          body: (
            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                At FAS ESSENTIALS, we inspect every product before dispatch. If you receive a product that is damaged, defective, or incorrect, you are entitled to an immediate replacement or full refund.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">7-Day Replacement Window</h4>
              <p>
                Please notify us within 7 days of receiving your order with a photo or video of the issue via email at support@fasessentials.in or through our Contact page.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">Conditions for Refund / Replacement</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Item must be unused and in original condition.</li>
                <li>Original packaging and accessories must be retained.</li>
                <li>Approved refunds are processed to the original payment method within 5–7 business days.</li>
              </ul>
            </div>
          )
        };
      case 'shipping':
        return {
          title: 'Shipping & Delivery Policy',
          icon: <Truck className="w-5 h-5 text-neutral-800" />,
          body: (
            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                We offer prompt, reliable courier delivery to addresses across India.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">Shipping Charges</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Orders above ₹499:</strong> FREE standard delivery.</li>
                <li><strong>Orders under ₹499:</strong> Flat delivery fee of ₹49.</li>
              </ul>
              <h4 className="font-semibold text-neutral-900 text-sm">Delivery Timelines</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dispatch time: Orders are packed and dispatched within 24–48 hours.</li>
                <li>Metro cities: Delivered in 2–4 business days.</li>
                <li>Rest of India: Delivered in 4–7 business days.</li>
                <li>Tracking details are provided as soon as the package is handed over to the courier partner.</li>
              </ul>
            </div>
          )
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <ShieldCheck className="w-5 h-5 text-neutral-800" />,
          body: (
            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                Your privacy is essential to us. FAS ESSENTIALS is committed to protecting your personal information.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">Information We Collect</h4>
              <p>
                We store account details, password hashes, session cookies, shopping carts, wishlists, orders, delivery details, reviews and support messages to operate the store. Payment details are handled by Razorpay; we store payment references, not card numbers. Newsletter subscriptions can be cancelled using the link in your welcome email. Contact support for data access or deletion requests.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">Data Security</h4>
              <p>
                We do not sell, rent, or share customer contact details with third-party marketers. Payment transactions are encrypted via secure payment gateways.
              </p>
            </div>
          )
        };
      case 'terms':
      default:
        return {
          title: 'Terms of Service',
          icon: <FileText className="w-5 h-5 text-neutral-800" />,
          body: (
            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                Welcome to FAS ESSENTIALS. By accessing or shopping on our website, you agree to the terms outlined here.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">Product Accuracy</h4>
              <p>
                We make every effort to display accurate specifications, capacities, dimensions, and colors. Product prices are in Indian Rupees (₹) and include applicable taxes.
              </p>
              <h4 className="font-semibold text-neutral-900 text-sm">Order Acceptance</h4>
              <p>
                We reserve the right to cancel or adjust orders in the rare case of inventory discrepancies or delivery region constraints. In such cases, a prompt refund will be issued.
              </p>
            </div>
          )
        };
    }
  };

  const content = getPolicyContent();

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            {content.icon}
            <h3 className="text-base font-bold text-neutral-950">{content.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {content.body}
        </div>
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
