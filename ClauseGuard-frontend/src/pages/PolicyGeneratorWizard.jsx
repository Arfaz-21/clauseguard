import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Globe2, 
  Users2, 
  ShieldCheck,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PolicyGeneratorWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    doc_type: 'privacy_policy',
    business_name: '',
    region: 'United States',
    audience: 'Consumers',
    collects_user_data: false,
    uses_cookies: false,
    has_subscriptions: false,
    third_party_integrations: false
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/documents/generate', {
        user_id: user.id,
        doc_type: formData.doc_type,
        business_data: formData
      });
      toast.success('Document generated successfully!');
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to generate document');
      setLoading(false);
    }
  };

  const docTypes = [
    { id: 'privacy_policy', name: 'Privacy Policy', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'terms_and_conditions', name: 'Terms & Conditions', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'refund_policy', name: 'Refund Policy', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'nda', name: 'Non-Disclosure (NDA)', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  return (
    <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Sparkles className="text-amber-500" />
          AI Legal Policy Generator
        </h1>
        <p className="text-slate-500 mt-2">Generate professional legal drafts tailored to your business in seconds.</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-12 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(step / 4) * 100}%` }}
          className="h-full bg-primary-600"
        />
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-primary-600" />
                What document do you need today?
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {docTypes.map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => {
                      setFormData({ ...formData, doc_type: type.id });
                      nextStep();
                    }}
                    className={`p-6 rounded-2xl border-2 text-left transition-all group ${
                      formData.doc_type === type.id 
                      ? 'border-primary-600 bg-primary-50/50 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 ${type.bg} ${type.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <type.icon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{type.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">AI-powered smart template</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="text-primary-600" />
                Tell us about your business
              </h2>
              <div className="glass-card p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="e.g., Acme Corp"
                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Operating Region</label>
                    <select 
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    >
                      <option>United States</option>
                      <option>European Union</option>
                      <option>India</option>
                      <option>Global</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Target Audience</label>
                    <select 
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                      className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    >
                      <option>Consumers (B2C)</option>
                      <option>Businesses (B2B)</option>
                      <option>Both</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={prevStep} className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2">
                  <ArrowLeft size={18} /> Back
                </button>
                <button onClick={nextStep} disabled={!formData.business_name} className="bg-slate-900 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2">
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-primary-600" />
                Data & Operations
              </h2>
              <div className="grid gap-4">
                {[
                  { id: 'collects_user_data', label: 'Do you collect user data?', desc: 'Names, emails, addresses, etc.', icon: Users2 },
                  { id: 'uses_cookies', label: 'Do you use cookies?', desc: 'Analytics, tracking, or preferences.', icon: Globe2 },
                  { id: 'has_subscriptions', label: 'Do you have paid subscriptions?', desc: 'Recurring payments or billing.', icon: CreditCard },
                  { id: 'third_party_integrations', label: 'Use third-party integrations?', desc: 'Google Analytics, Stripe, etc.', icon: MessageSquare }
                ].map((toggle) => (
                  <button 
                    key={toggle.id}
                    onClick={() => setFormData({ ...formData, [toggle.id]: !formData[toggle.id] })}
                    className={`p-5 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${
                      formData[toggle.id] ? 'border-primary-600 bg-primary-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 ${formData[toggle.id] ? 'bg-primary-100 text-primary-600' : 'bg-slate-50 text-slate-400'} rounded-lg flex items-center justify-center`}>
                      <toggle.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{toggle.label}</h4>
                      <p className="text-xs text-slate-500">{toggle.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData[toggle.id] ? 'border-primary-600 bg-primary-600' : 'border-slate-200'}`}>
                      {formData[toggle.id] && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={prevStep} className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2">
                  <ArrowLeft size={18} /> Back
                </button>
                <button onClick={nextStep} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2">
                  Review & Generate <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Sparkles size={40} />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-primary-600 rounded-full"
                />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to generate your {formData.doc_type.replace('_', ' ')}?</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-10">Our AI will process your business data and draft a professional document for your review.</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/25 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Generate Document Now'}
                  {!loading && <ArrowRight size={20} />}
                </button>
                <button onClick={prevStep} className="text-slate-500 font-semibold hover:text-slate-800 transition-colors">
                  Adjust my answers
                </button>
              </div>

              <p className="mt-12 text-xs text-slate-400 max-w-md mx-auto">
                By generating, you agree that ClauseGuard is providing an AI-assisted draft for informational purposes only.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PolicyGeneratorWizard;
