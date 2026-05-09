import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agreementService } from '../services/agreementService';
import { disputeService } from '../services/disputeService';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  MessageSquare, AlertCircle, CheckCircle2, ChevronRight, 
  Info, Scale, Zap, ShieldAlert, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const AnalysisPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dispute state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeDesc, setDisputeDesc] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const fetchAgreement = async () => {
    try {
      const data = await agreementService.getAgreement(id);
      setAgreement(data);
    } catch (error) {
      toast.error('Failed to load agreement details');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgreement();
    
    // Auto-poll if document is pending
    let interval;
    if (agreement?.status === 'uploaded' || isLoading) {
      interval = setInterval(() => {
        fetchAgreement();
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, agreement?.status]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAgreement();
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeDesc.trim()) return;
    
    setIsSubmittingDispute(true);
    try {
      await disputeService.createDispute({
        agreement_id: parseInt(id),
        raised_by: user.id,
        description: disputeDesc
      });
      toast.success('Dispute raised successfully');
      setShowDisputeForm(false);
      setDisputeDesc('');
    } catch (error) {
      toast.error('Failed to raise dispute');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isPending = agreement?.status === 'uploaded';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            Contract Analysis
            {isPending ? (
              <span className="ml-3 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Pending AI Audit
              </span>
            ) : (
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" /> Audited
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Agreement #{agreement.id} • {agreement.file_path}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!isPending && (
             <button 
               onClick={() => setShowDisputeForm(!showDisputeForm)}
               className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
             >
               <MessageSquare className="w-4 h-4 mr-2" />
               Raise Dispute
             </button>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">AI is analyzing your document</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Our AI teammate is currently reading and extracting clauses from your PDF. This usually takes a few moments. Please click refresh to check for updates.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Extracted Text */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-500" /> Extracted Document Text
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 font-mono text-sm text-slate-700 whitespace-pre-wrap">
              {agreement.extracted_text || "No text could be extracted from this document."}
            </div>
          </div>

          {/* Audit Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-primary-50 flex items-center justify-between">
              <h3 className="font-bold text-primary-800 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2" /> AI Audit Results
              </h3>
              {agreement.audit_result && typeof agreement.audit_result === 'string' && agreement.audit_result.startsWith('{') && (
                <div className="px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                  Structured Data
                </div>
              )}
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-slate-800">
              <AuditResultsRenderer result={agreement.audit_result} />
            </div>
          </div>
        </div>
      )}

      {/* Dispute Form Modal/Inline */}
      {showDisputeForm && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 mt-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Raise a Dispute
          </h3>
          <p className="text-red-700 text-sm mb-4">Did the AI miss something, or do you disagree with a clause? Describe the issue below.</p>
          <form onSubmit={handleDisputeSubmit}>
            <textarea
              className="w-full p-3 border border-red-300 rounded-lg bg-white mb-4 outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
              placeholder="E.g., Clause 4 states I must paint the house before leaving, which wasn't discussed..."
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              required
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setShowDisputeForm(false)}
                className="px-4 py-2 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingDispute}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-70"
              >
                {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Helper Components for Audit Results ---

const AuditResultsRenderer = ({ result }) => {
  if (!result) return <div className="text-slate-400 italic">No audit results provided by AI.</div>;

  let data;
  try {
    // Attempt to parse if it's a JSON string
    data = typeof result === 'string' ? JSON.parse(result) : result;
  } catch (e) {
    // Fallback to raw text rendering if not JSON
    return (
      <div className="whitespace-pre-wrap prose prose-sm max-w-none text-slate-700">
        {result}
      </div>
    );
  }

  // Handle the single result or array of results
  const items = data.results || [data];
  const riskScore = data.risk_score || (items[0]?.risk_score);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overall Score Card */}
      {riskScore !== undefined && (
        <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Overall Risk Score</h4>
            <div className="flex items-baseline">
              <span className={`text-4xl font-black ${riskScore > 70 ? 'text-red-600' : riskScore > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                {Math.round(riskScore)}
              </span>
              <span className="text-slate-400 font-medium ml-1">/100</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center ${
               riskScore > 70 ? 'bg-red-100 text-red-700' : 
               riskScore > 30 ? 'bg-amber-100 text-amber-700' : 
               'bg-green-100 text-green-700'
             }`}>
               {riskScore > 70 ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> : 
                riskScore > 30 ? <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> : 
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
               {riskScore > 70 ? 'HIGH RISK' : riskScore > 30 ? 'MODERATE RISK' : 'SAFE DOCUMENT'}
             </div>
             <p className="text-[10px] text-slate-400 mt-2 font-medium">Based on Indian Tenancy Law (MTA 2021)</p>
          </div>
        </div>
      )}

      {/* Categorized Risks */}
      <div className="space-y-4">
        <h4 className="text-slate-900 font-bold flex items-center">
          <Zap className="w-4 h-4 mr-2 text-primary-500" /> Clause-by-Clause Analysis
        </h4>
        
        {items.map((item, idx) => (
          <RiskCard key={idx} item={item} />
        ))}
      </div>

      {/* Legal Footer */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start">
        <Info className="w-4 h-4 text-slate-400 mr-3 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          This analysis is generated by AI using the Model Tenancy Act 2021 as a primary reference. 
          It does not constitute legal advice. For binding interpretations, please consult with a legal professional.
        </p>
      </div>
    </div>
  );
};

const RiskCard = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getSeverityColors = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500 text-white border-red-600';
      case 'HIGH': return 'bg-orange-500 text-white border-orange-600';
      case 'MEDIUM': return 'bg-amber-500 text-white border-amber-600';
      case 'LOW': return 'bg-green-500 text-white border-green-600';
      default: return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const getSeverityBg = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-50 border-red-100 hover:border-red-200';
      case 'HIGH': return 'bg-orange-50 border-orange-100 hover:border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 border-amber-100 hover:border-amber-200';
      case 'LOW': return 'bg-green-50 border-green-100 hover:border-green-200';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const level = item.risk_level || (item.verdict === 'NON_COMPLIANT' ? 'HIGH' : 'LOW');

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${getSeverityBg(level)}`}>
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${getSeverityColors(level)}`}>
            {level}
          </div>
          <span className="font-bold text-slate-900 text-sm">
            {item.clause_category || 'Legal Clause'}
          </span>
          <span className="text-slate-500 text-xs truncate max-w-[200px]">
             • {item.verdict?.replace('_', ' ')}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-slate-600' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <hr className="border-slate-200" />
          
          {/* Simple Explanation */}
          <div className="space-y-1">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <Zap className="w-3 h-3 mr-1.5" /> What this means
            </h5>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {item.explanation?.simplified || item.explanation}
            </p>
          </div>

          {/* Legal Depth */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1.5 text-red-500" /> Why it's risky
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                {item.explanation?.why_it_risky || "This clause may grant excessive power to the other party or waive your legal rights."}
              </p>
            </div>
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <BookOpen className="w-3 h-3 mr-1.5 text-blue-500" /> Law Reference
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.law_reference}
              </p>
            </div>
          </div>

          {/* Suggestion / Solution */}
          {item.suggestion && (
             <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" /> Suggested Safer Version
                </h5>
                <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                  {item.suggestion}
                </p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
