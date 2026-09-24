import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle, Mail, PhoneCall } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Shipping & Delivery',
    question: 'How fast will my order arrive and how do I track it?',
    answer: 'All orders are dispatched from our fulfillment center within 24 to 48 hours. Metro cities (Mumbai, Bengaluru, Delhi NCR, Hyderabad, Chennai, Kolkata) generally receive orders within 2 to 4 business days. Other pin codes take 3 to 6 days. Track your order from your account once the courier tracking link has been added.'
  },
  {
    id: 'faq-2',
    category: 'Payment & COD',
    question: 'Is Cash on Delivery (COD) available for my pincode?',
    answer: 'Cash on Delivery is available for Indian shipping addresses, subject to fulfillment confirmation. You can also pay seamlessly via UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, or Net Banking during checkout for instant verification.'
  },
  {
    id: 'faq-3',
    category: 'Replacements & Returns',
    question: 'What is your 7-Day Replacement Policy if an item arrives damaged?',
    answer: 'We pack all glass and steel items in heavy-duty impact-resistant protective wrapping. However, in the rare event of transit damage or a manufacturing defect, simply share a quick photo of the item via WhatsApp or email to support@fasessentials.in within 7 days of delivery, and we will send a brand-new replacement at zero cost.'
  },
  {
    id: 'faq-4',
    category: 'Quality & Materials',
    question: 'Are the materials truly BPA-free and food-safe?',
    answer: '100% yes. Our 3-in-1 dispenser is molded from certified non-toxic ABS polymer, our 2-in-1 oil sprayer utilizes lead-free soda-lime food glass, and all insulated tumblers are crafted with inner SUS304 food-grade stainless steel that will never rust, retain stale smells, or react with acidic beverages.'
  },
  {
    id: 'faq-5',
    category: 'Product Use',
    question: 'How does the LED Temperature Smart Mug work? Does it need charging?',
    answer: 'The smart LED temperature display is powered by an ultra-low-power integrated chip and battery embedded inside the waterproof lid. It requires no charging cables or battery replacements and lasts over 50,000 touch cycles (approximately 3 to 4 years of typical daily usage). Simply touch the top to view the temperature in Celsius.'
  },
  {
    id: 'faq-6',
    category: 'Product Care',
    question: 'How should I clean the tumblers and oil sprayer?',
    answer: 'For the Stainless Steel Tumblers and Coffee Mug, hand washing with warm soapy water and a bottle sponge is recommended to protect exterior powder coating. For the Glass Oil Sprayer, the glass bottle is top-rack dishwasher safe, while the misting trigger should simply be flushed through with warm soapy water.'
  }
];

interface FaqSectionProps {
  onContactClick?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onContactClick }) => {
  const [openId, setOpenId] = useState<string>('faq-1');

  const toggle = (id: string) => {
    setOpenId(openId === id ? '' : id);
  };

  return (
    <section id="faq-section" className="py-14 sm:py-20 bg-white border-b border-zinc-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-bold uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base">
            Everything you need to know about our products, delivery timelines, replacement guarantee, and payments.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3 text-left">
          {FAQ_DATA.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-zinc-200 rounded-2xl overflow-hidden transition-all bg-[#FAFAF8] hover:border-zinc-300 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      {faq.category}
                    </span>
                    <h3 className="font-display font-bold text-sm sm:text-base text-zinc-950">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`p-2 rounded-full bg-white border border-zinc-200 text-zinc-700 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 bg-zinc-950 text-white border-zinc-950' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-200/60 pt-4 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-zinc-100/70 border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-display font-bold text-sm text-zinc-950">
              Have another question not listed here?
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Our support team is available Monday to Saturday, 9:30 AM – 6:30 PM IST.
            </p>
          </div>
          <button
            type="button"
            onClick={onContactClick}
            className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Contact Customer Support →
          </button>
        </div>

      </div>
    </section>
  );
};
