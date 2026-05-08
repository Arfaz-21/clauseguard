import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, FileSearch, Zap, CheckCircle, ArrowRight, Lock, Scale, FileText } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Abstract Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-primary-300 blur-3xl"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-300 blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-200 blur-3xl opacity-60"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-6 py-5 flex justify-between items-center glass border-b border-white/50 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">ClauseGuard</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/auth" className="text-slate-600 hover:text-primary-600 font-medium transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link to="/auth" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-md flex items-center gap-2">
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center pt-24 pb-20 px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white backdrop-blur-sm text-primary-700 text-sm font-semibold mb-8 shadow-sm">
              <Zap size={16} className="text-amber-500" />
              <span>AI-Powered Legal Assistant</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Agreements</span> with Confidence
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your lease, let our advanced AI analyze every clause, and avoid hidden traps. Ensure fair terms for both tenants and landlords in seconds.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 hover:-translate-y-1">
                Analyze Contract
                <ArrowRight size={20} />
              </Link>
              <button onClick={() => {
                document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
              }} className="bg-white/80 hover:bg-white text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-sm border border-slate-200 flex items-center justify-center gap-2 backdrop-blur-sm">
                How it works
              </button>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8 max-w-6xl w-full mt-32"
          >
            <motion.div variants={itemVariants} className="glass-card p-8 group hover:border-primary-200 transition-colors">
              <div className="w-14 h-14 bg-blue-100/80 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <FileSearch className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Analysis</h3>
              <p className="text-slate-600 leading-relaxed">Our AI scans pages of legal jargon in seconds, highlighting what matters and breaking down complex terms into plain English.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card p-8 group hover:border-amber-200 transition-colors">
              <div className="w-14 h-14 bg-amber-100/80 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Find Hidden Clauses</h3>
              <p className="text-slate-600 leading-relaxed">Identify unfair terms, hidden fees, and unusual responsibilities before you sign. Protect yourself from predatory agreements.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="glass-card p-8 group hover:border-green-200 transition-colors">
              <div className="w-14 h-14 bg-green-100/80 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Scale className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dispute Resolution</h3>
              <p className="text-slate-600 leading-relaxed">Easily raise disputes with AI-backed assessments of contract violations. Generate professional legal responses instantly.</p>
            </motion.div>
          </motion.div>

          {/* Trust Section */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mt-32 max-w-4xl w-full text-center"
            id="how-it-works"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Bank-Grade Security for Your Documents</h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-3 text-slate-700 bg-white/60 px-6 py-3 rounded-full border border-white shadow-sm">
                <Lock className="text-primary-600" size={20} />
                <span className="font-medium">End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 bg-white/60 px-6 py-3 rounded-full border border-white shadow-sm">
                <CheckCircle className="text-green-600" size={20} />
                <span className="font-medium">Data Privacy Guaranteed</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 bg-white/60 px-6 py-3 rounded-full border border-white shadow-sm">
                <FileText className="text-indigo-600" size={20} />
                <span className="font-medium">Auto-Deletion Post Analysis</span>
              </div>
            </div>
          </motion.div>
        </main>
        
        <footer className="py-8 text-center text-slate-500 text-sm glass border-t border-white/50 relative z-10 mt-auto">
          <p>© 2026 ClauseGuard. Built for Alva's Hackathon.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
