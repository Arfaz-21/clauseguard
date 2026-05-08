import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        
        <div className="glass-card p-8 md:p-12 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Shield className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, upload a document, or communicate with us. This includes your name, email address, and the content of the rental agreements you upload for analysis.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our services, including the AI-powered analysis of your rental agreements. We do not sell your personal data or document contents to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Data Security</h2>
              <p>We use bank-grade encryption to protect your documents during transit and at rest. Your uploaded agreements are automatically processed and are only stored for as long as necessary to provide the requested analysis.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Google Data</h2>
              <p>ClauseGuard's use and transfer to any other app of information received from Google APIs will adhere to the Google API Service User Data Policy, including the Limited Use requirements.</p>
            </section>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-sm text-slate-400">
            Last updated: May 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
