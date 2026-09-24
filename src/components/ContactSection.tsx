import { api } from '../lib/api';
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, MessageSquare, ShieldCheck } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); try { await api('/contact','POST',formData); setSubmitted(true); } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  };

  return (
    <section id="contact-section" className="py-14 sm:py-20 bg-[#FAFAF8] border-b border-zinc-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Responsive Support</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 tracking-tight">
            We’re Here to Help
          </h2>
          <p className="text-sm text-zinc-600 max-w-xl">
            Have a question about product compatibility, an ongoing delivery, or bulk gifting? Our team responds within 24 business hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 shadow-sm">
          {/* Left Column: Contact Form */}
          <div className="md:col-span-7">{error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
            {submitted ? (
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900">Message Received</h3>
                <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
                  Thank you for writing to FAS ESSENTIALS. A customer support representative will review your message and reply to{' '}
                  <span className="font-bold text-zinc-950">{formData.email}</span> promptly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', comment: '' });
                  }}
                  className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="contact-your-name" className="block text-zinc-700 font-bold mb-1">Your Name *</label>
                  <input id="contact-your-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ananya Sen"
                    className="w-full p-3 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="contact-email-address" className="block text-zinc-700 font-bold mb-1">Email Address *</label>
                    <input id="contact-email-address"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ananya@example.com"
                      className="w-full p-3 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone-number" className="block text-zinc-700 font-bold mb-1">Phone Number</label>
                    <input id="contact-phone-number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full p-3 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-your-message-or-order-query" className="block text-zinc-700 font-bold mb-1">Your Message or Order Query *</label>
                  <textarea id="contact-your-message-or-order-query"
                    rows={4}
                    required
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Describe how we can assist you..."
                    className="w-full p-3 rounded-xl border border-zinc-300 bg-zinc-50 focus:outline-hidden focus:border-zinc-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message to Team</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Support Channels */}
          <div className="md:col-span-5 space-y-6 md:border-l border-zinc-200 md:pl-8 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-display text-sm font-extrabold text-zinc-950 uppercase tracking-wider">
                Direct Communication Channels
              </h3>

              <div className="space-y-3.5 text-xs text-zinc-600">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-900">Email Inquiries</p>
                    <a
                      href="mailto:support@fasessentials.in"
                      className="text-zinc-600 hover:text-zinc-950 hover:underline"
                    >
                      support@fasessentials.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-900">Customer Support</p>
                    <p className="text-zinc-600">Please use the contact form for delivery and product queries.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <Clock className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-900">Average Response Time</p>
                    <p className="text-zinc-600">&lt; 4 hours during business hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold block">Looking to replace a damaged item?</span>
              <p className="text-amber-800">
                Please attach or mention your order ID and a quick photo of the damaged parcel for instantaneous replacement approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
