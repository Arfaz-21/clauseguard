import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
        
        <div className="glass-card p-8 md:p-12 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FileText className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using ClauseGuard, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
              <p>ClauseGuard provides an AI-powered platform for analyzing rental agreements. The analysis provided is for informational purposes only and does not constitute legal advice. We recommend consulting with a qualified attorney for specific legal concerns.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. User Responsibilities</h2>
              <p>You are responsible for ensuring you have the right to upload any documents you provide to the service. You agree not to use the service for any illegal or unauthorized purpose.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Limitation of Liability</h2>
              <p>ClauseGuard is provided "as is" without warranty of any kind. We shall not be liable for any damages arising out of your use of the service or reliance on our AI analysis.</p>
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

export default TermsPage;
