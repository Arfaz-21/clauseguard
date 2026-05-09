import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agreementService } from '../services/agreementService';
import { disputeService } from '../services/disputeService';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  MessageSquare, AlertCircle, CheckCircle2, ChevronRight, 
  Info, Scale, Zap, ShieldAlert, BookOpen, Search, Layers, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

const LEGAL_TIPS = [
  "Tip: Under MTA 2021, security deposits for residential premises are capped at 2 months' rent.",
  "Insight: A rental agreement must be registered with the Rent Authority to be legally binding.",
  "Did you know? Landlords cannot cut off essential supplies like water or electricity during a dispute.",
  "Tip: Always check the 'Notice Period' clause; 1 month is standard, but some try to sneak in 3 months.",
  "Legal Note: Structural repairs are usually the landlord's responsibility unless specified otherwise.",
  "Insight: The Model Tenancy Act aims to protect both landlords and tenants through a fast-track Rent Court."
];

const AnalysisPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTip, setActiveTip] = useState(0);
  const textContainerRef = React.useRef(null);
  
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
    
    // Auto-poll if document is in any processing stage
    let interval;
    const processingStates = ['uploaded', 'extracting', 'analyzing', 'finalizing'];
    if (agreement && (processingStates.includes(agreement.status) || isLoading)) {
      interval = setInterval(() => {
        fetchAgreement();
      }, 2000); // Faster polling (2s) for better responsiveness
    }
    
    // Rotate legal tips
    const tipInterval = setInterval(() => {
      setActiveTip(prev => (prev + 1) % LEGAL_TIPS.length);
    }, 5000);
    
    return () => {
      if (interval) clearInterval(interval);
      if (tipInterval) clearInterval(tipInterval);
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
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse text-sm">Initializing Analysis...</p>
      </div>
    );
  }

  const isProcessing = ['uploaded', 'extracting', 'analyzing', 'finalizing'].includes(agreement?.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            Contract Analysis
            {agreement.status === 'uploaded' || agreement.status === 'extracting' || agreement.status === 'analyzing' ? (
              <span className="ml-3 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {agreement.status === 'uploaded' ? 'Queued' : agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}...
              </span>
            ) : agreement.status === 'error' ? (
              <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" /> Audit Failed
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
          {!isProcessing && agreement.status !== 'error' && (
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

      {isProcessing ? (
        <ProcessingState currentStatus={agreement.status} tip={LEGAL_TIPS[activeTip]} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Extracted Text */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center text-sm">
                <FileText className="w-4 h-4 mr-2 text-slate-500" /> Extracted Document Text
              </h3>
            </div>
            <div 
              ref={textContainerRef}
              className="p-6 overflow-y-auto flex-1 bg-slate-50 font-mono text-xs text-slate-700 whitespace-pre-wrap scroll-smooth leading-relaxed"
            >
              {agreement.extracted_text || "No text could be extracted from this document."}
            </div>
          </div>

          {/* Audit Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-slate-200 bg-primary-50 flex items-center justify-between">
              <h3 className="font-bold text-primary-800 flex items-center text-sm">
                <ShieldCheck className="w-4 h-4 mr-2" /> AI Audit Results
              </h3>
              <div className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[9px] font-bold uppercase tracking-wider rounded">
                MTA-2021 Compliant
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-slate-800">
              <AuditResultsRenderer 
                result={agreement.audit_result} 
                onScrollToClause={(text) => {
                  if (textContainerRef.current) {
                    const container = textContainerRef.current;
                    const fullText = container.innerText;
                    const index = fullText.indexOf(text);
                    if (index !== -1) {
                      container.scrollTop = (index / fullText.length) * container.scrollHeight - 100;
                      toast.success(`Located in document`, { icon: '📍' });
                    } else {
                      const partial = text.substring(0, 40);
                      const pIndex = fullText.indexOf(partial);
                      if (pIndex !== -1) {
                        container.scrollTop = (pIndex / fullText.length) * container.scrollHeight - 100;
                        toast.success(`Located in document`, { icon: '📍' });
                      }
                    }
                  }
                }}
              />
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

// --- Waiting / Processing State Component ---

const ProcessingState = ({ currentStatus, tip }) => {
  const stages = [
    { id: 'uploaded', label: 'Queued', icon: Clock },
    { id: 'extracting', label: 'Extracting Text', icon: Layers },
    { id: 'analyzing', label: 'Analyzing Risks', icon: Brain },
    { id: 'finalizing', label: 'Finalizing Report', icon: CheckCircle2 },
  ];

  const currentIndex = stages.findIndex(s => s.id === currentStatus);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center max-w-2xl mx-auto text-center space-y-10">
      <div className="relative">
        <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center animate-pulse">
          <Brain className="w-12 h-12" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-primary-500 flex items-center justify-center animate-bounce">
          <Zap className="w-3 h-3 text-primary-500 fill-primary-500" />
        </div>
      </div>

      <div className="space-y-3 w-full">
        <h2 className="text-2xl font-black text-slate-900">ClauseGuard is on the case</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">Our AI agent is currently cross-referencing your agreement with the Model Tenancy Act 2021.</p>
      </div>

      {/* Progress Stepper */}
      <div className="w-full space-y-6">
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary-500 transition-all duration-1000 ease-in-out" 
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-[-30deg] animate-shimmer" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={stage.id} className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isCurrent ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 scale-110' :
                  isActive ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                  isActive ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal Tip Card */}
      <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center space-x-2 text-primary-600 mb-2">
          <Info className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Did you know?</span>
        </div>
        <p className="text-slate-600 text-sm font-medium italic leading-relaxed min-h-[40px] flex items-center justify-center">
          {tip}
        </p>
      </div>
    </div>
  );
};

// --- Helper Components for Audit Results ---

const AuditResultsRenderer = ({ result, onScrollToClause }) => {
  if (!result) return <div className="text-slate-400 italic">No audit results provided by AI.</div>;

  let data;
  try {
    data = typeof result === 'string' ? JSON.parse(result) : result;
  } catch (e) {
    return (
      <div className="whitespace-pre-wrap prose prose-sm max-w-none text-slate-700">
        {result}
      </div>
    );
  }

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
              <span className="text-slate-400 font-medium ml-1 text-sm">/100</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black flex items-center ${
               riskScore > 70 ? 'bg-red-100 text-red-700' : 
               riskScore > 30 ? 'bg-amber-100 text-amber-700' : 
               'bg-green-100 text-green-700'
             }`}>
               {riskScore > 70 ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> : 
                riskScore > 30 ? <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> : 
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
               {riskScore > 70 ? 'HIGH RISK' : riskScore > 30 ? 'MODERATE RISK' : 'SAFE DOCUMENT'}
             </div>
             <p className="text-[10px] text-slate-400 mt-2 font-medium">Verified by ClauseGuard Engine</p>
          </div>
        </div>
      )}

      {/* Categorized Risks */}
      <div className="space-y-4">
        <h4 className="text-slate-900 font-bold flex items-center text-sm">
          <Zap className="w-4 h-4 mr-2 text-primary-500" /> Clause-by-Clause Analysis
        </h4>
        
        {items.map((item, idx) => (
          <RiskCard key={idx} item={item} onScrollToClause={onScrollToClause} />
        ))}
      </div>

      {/* Legal Footer */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start">
        <Info className="w-3.5 h-3.5 text-slate-400 mr-3 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          This analysis is generated by AI using the Model Tenancy Act 2021. 
          For binding interpretations, please consult with a legal professional.
        </p>
      </div>
    </div>
  );
};

const RiskCard = ({ item, onScrollToClause }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getSeverityColors = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500 text-white shadow-red-100';
      case 'HIGH': return 'bg-orange-500 text-white shadow-orange-100';
      case 'MEDIUM': return 'bg-amber-500 text-white shadow-amber-100';
      case 'LOW': return 'bg-green-500 text-white shadow-green-100';
      default: return 'bg-slate-500 text-white shadow-slate-100';
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
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${getSeverityBg(level)} shadow-sm`}>
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm ${getSeverityColors(level)}`}>
            {level}
          </div>
          <span className="font-bold text-slate-900 text-sm">
            {item.clause_category || 'Legal Clause'}
          </span>
          {item.location?.page && (
            <span className="px-1.5 py-0.5 bg-white/50 text-slate-500 text-[9px] font-bold rounded border border-slate-200/50">
              PAGE {item.location.page}
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-slate-600' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <hr className="border-slate-200/50" />
          
          <div className="flex justify-end">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onScrollToClause(item.clause);
              }}
              className="flex items-center px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-[9px] font-black transition-all hover:scale-105"
            >
              <Zap className="w-3 h-3 mr-1.5 text-primary-500" /> JUMP TO CLAUSE
            </button>
          </div>

          <div className="space-y-1">
            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Info className="w-3 h-3 mr-1.5" /> AI Interpretation
            </h5>
            <p className="text-xs text-slate-800 font-bold leading-relaxed">
              {item.explanation?.simplified || item.explanation}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1 p-3 bg-white/50 rounded-lg border border-white/50">
              <h5 className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1.5" /> Risk Analysis
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                {item.explanation?.why_it_risky || "This clause may grant excessive power or waive legal rights."}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-white/50 rounded-lg border border-white/50">
              <h5 className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                <BookOpen className="w-3 h-3 mr-1.5" /> MTA Reference
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {item.law_reference}
              </p>
            </div>
          </div>

          {item.suggestion && (
             <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <h5 className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" /> Safer Alternative
                </h5>
                <div className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                  {item.suggestion}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
