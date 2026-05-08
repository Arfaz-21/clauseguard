import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const PolicyBuilderPage = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New Policy State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [rules, setRules] = useState([
    { id: 1, text: 'No pets allowed without prior written consent.', category: 'Standard' },
    { id: 2, text: 'Late fee of $50 applies after 5 days of delay.', category: 'Financial' }
  ]);

  useEffect(() => {
    fetchPolicies();
  }, [user]);

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/policies/user/${user.id}`);
      setPolicies(response.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const nextId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
    setRules([...rules, { id: nextId, text: '', category: 'Custom' }]);
  };

  const removeRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id, text) => {
    setRules(rules.map(r => r.id === id ? { ...r, text } : r));
  };

  const savePolicy = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a policy name');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/policies/', {
        user_id: user.id,
        name: newName,
        description: newDesc,
        rules: JSON.stringify(rules)
      });
      
      setPolicies([response.data, ...policies]);
      setIsCreating(false);
      setNewName('');
      setNewDesc('');
      setRules([]);
      toast.success('Policy set created successfully!');
    } catch (error) {
      toast.error('Failed to save policy');
    }
  };

  const deletePolicy = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/policies/${id}`);
      setPolicies(policies.filter(p => p.id !== id));
      toast.success('Policy deleted');
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Policy Builder</h1>
          <p className="text-slate-500 mt-1">Create custom rule sets for AI-powered agreement auditing.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
        >
          {isCreating ? <ArrowLeft size={18} /> : <Plus size={18} />}
          {isCreating ? 'Back to Policies' : 'New Policy Set'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div 
            key="builder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">Policy Set Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Standard NYC Rental Rules"
                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">Description (Optional)</label>
                  <input 
                    type="text" 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Briefly describe what these rules cover"
                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Settings2 size={20} className="text-primary-600" />
                    Rules & Constraints
                  </h3>
                  <button 
                    onClick={addRule}
                    className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Rule
                  </button>
                </div>

                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <motion.div 
                      key={rule.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 group"
                    >
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={rule.text}
                          onChange={(e) => updateRule(rule.id, e.target.value)}
                          placeholder="Describe the rule..."
                          className="w-full bg-white/30 border border-slate-200 rounded-xl px-4 py-3 pr-20 focus:ring-2 focus:ring-primary-500/10 outline-none transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] uppercase tracking-wider font-bold rounded">
                          {rule.category}
                        </span>
                      </div>
                      <button 
                        onClick={() => removeRule(rule.id)}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={savePolicy}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Policy Set
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {policies.map((p) => (
              <motion.div 
                layout
                key={p.id}
                className="glass-card p-6 flex flex-col group hover:border-primary-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <button 
                    onClick={() => deletePolicy(p.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{p.name}</h3>
                <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">{p.description || 'No description provided.'}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {JSON.parse(p.rules || '[]').length} Rules
                  </span>
                  <button className="text-primary-600 hover:text-primary-700 font-bold text-sm flex items-center gap-1 transition-transform hover:translate-x-1">
                    Edit Set
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}

            {policies.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center glass-card border-dashed">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No policies found</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto text-balance">Start by creating your first policy set to define the rules for your automated audits.</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="text-primary-600 font-bold hover:underline underline-offset-4 flex items-center justify-center gap-2 mx-auto"
                >
                  <Plus size={18} /> Create your first policy
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ArrowLeft = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

export default PolicyBuilderPage;
