import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agreementService } from '../services/agreementService';
import { disputeService } from '../services/disputeService';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Clock, AlertTriangle, ShieldCheck, RefreshCw, 
  MessageSquare, AlertCircle, CheckCircle2, ChevronRight, 
  Info, Scale, Zap, ShieldAlert, BookOpen, Search, Layers, Brain, Play,
  Lock, AlertOctagon, CreditCard, Key, Calendar, MapPin, 
  Briefcase, Ban, EyeOff, FileQuestion, Lightbulb, Hourglass,
  Send, X, Bot, User, Sparkles, FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const RAG_URL = import.meta.env.VITE_RAG_URL || 'http://localhost:8001';

// --- Chat Interface Component ---

const ChatInterface = ({ documentText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your ClauseGuard Legal Assistant. Ask me anything about this contract.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = React.useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch(`${RAG_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          document_text: documentText
        })
      });

      const data = await response.json();
      
      let botContent = data.answer || "I'm sorry, I couldn't analyze that part of the contract.";
      if (data.action_item) {
        botContent += `\n\n**💡 Action Item:** ${data.action_item}`;
      }

      setMessages(prev => [...prev, { role: 'bot', content: botContent, meta: data }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Error: I'm having trouble connecting to the legal engine." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40 group"
      >
        <MessageSquare className="w-7 h-7" />
        <div className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-slate-700">
          ASK THE LAWYER
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Legal Assistant</h3>
                <div className="flex items-center text-green-400 text-[10px] font-bold">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse" />
                  ONLINE • RAG ENABLED
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.role === 'bot' ? (
                    <div className="space-y-3">
                      <div className="whitespace-pre-wrap">
                        {msg.content.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-primary-600 font-bold">{part}</strong> : part)}
                      </div>
                      {msg.meta?.legal_reference && (
                        <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold flex items-center">
                          <Scale className="w-3 h-3 mr-1.5 text-primary-400" /> {msg.meta.legal_reference}
                        </div>
                      )}
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-3">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pet policy, deposit..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            />
            <button 
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

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
  const [isStartingAudit, setIsStartingAudit] = useState(false);
  const [activeTip, setActiveTip] = useState(0);
  const [highlightedText, setHighlightedText] = useState('');
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
    const isProcessingStatus = agreement ? processingStates.some(state => agreement.status.startsWith(state)) : false;
    
    if (isProcessingStatus || isLoading) {
      // Poll every 2 seconds until processing completes
      interval = setInterval(() => {
        fetchAgreement();
      }, 2000);
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

  // Show popup toast if API credits are exhausted
  useEffect(() => {
    if (agreement && agreement.audit_result) {
      try {
        const parsed = typeof agreement.audit_result === 'string' ? JSON.parse(agreement.audit_result) : agreement.audit_result;
        const items = parsed.results || [];
        const quotaError = items.find(item => item.explanation?.simplified?.includes("API credits have been exhausted"));
        if (quotaError) {
          toast.error("API credits have been exhausted cant perform Analysis Contact the admin ,Gmail : manishprojects0@gmail.com", {
            duration: 10000,
            id: 'quota-error',
            style: {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              maxWidth: '500px',
              padding: '24px',
              borderRadius: '16px',
              background: '#FFFFFF',
              color: '#EF4444',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '2px solid #EF4444',
            }
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [agreement]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAgreement();
  };

  const handleStartAudit = async () => {
    setIsStartingAudit(true);
    try {
      const updated = await agreementService.reAudit(id);
      setAgreement(updated);
      toast.success('Audit started successfully');
    } catch (error) {
      toast.error('Failed to start audit');
    } finally {
      setIsStartingAudit(false);
    }
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

  const isProcessing = ['extracting', 'analyzing', 'finalizing'].includes(agreement?.status);
  const isPendingStart = agreement?.status === 'uploaded';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            Contract Analysis
            {isPendingStart ? (
              <span className="ml-3 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Pending Analysis
              </span>
            ) : isProcessing ? (
              <span className="ml-3 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full flex items-center">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}...
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
          {isPendingStart || agreement.status === 'error' ? (
            <button 
              onClick={handleStartAudit}
              disabled={isStartingAudit}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-primary-200"
            >
              <Play className={`w-4 h-4 mr-2 ${isStartingAudit ? 'animate-pulse' : ''}`} />
              {isStartingAudit ? 'Starting...' : 'Run AI Audit'}
            </button>
          ) : (
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          
          {!isProcessing && !isPendingStart && agreement.status !== 'error' && (
             <div className="flex items-center space-x-2">

               <button 
                 onClick={() => setShowDisputeForm(!showDisputeForm)}
                 className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
               >
                 <MessageSquare className="w-4 h-4 mr-2" />
                 Raise Dispute
               </button>
             </div>
          )}
        </div>
      </div>

      {isProcessing ? (
        <ProcessingState currentStatus={agreement.status} tip={LEGAL_TIPS[activeTip]} />
      ) : isPendingStart ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Analysis Ready to Start</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Click the button above to begin the AI-powered legal audit. We'll cross-reference your agreement with Indian Tenancy Law.</p>
          </div>
          <div className="pt-4">
             <button 
               onClick={handleStartAudit}
               disabled={isStartingAudit}
               className="inline-flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-primary-200 hover:-translate-y-1"
             >
               <Brain className="w-5 h-5 mr-3" />
               Launch AI Auditor
             </button>
          </div>
        </div>
      ) : (
        <div id="audit-report-content" className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
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
              {agreement.extracted_text ? (
                <HighlightedText 
                  text={agreement.extracted_text} 
                  highlight={highlightedText} 
                  containerRef={textContainerRef} 
                />
              ) : "No text could be extracted from this document."}
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
                status={agreement.status}
                onStartAudit={handleStartAudit}
                onScrollToClause={(text) => {
                  setHighlightedText(text);
                  toast.success(`Located in document`, { icon: '📍' });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dispute Form */}
      {showDisputeForm && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 mt-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Raise a Dispute
          </h3>
          <p className="text-red-700 text-sm mb-4">Did the AI miss something, or do you disagree with a clause? Describe the issue below.</p>
          <form onSubmit={handleDisputeSubmit}>
            <textarea
              className="w-full p-3 border border-red-300 rounded-lg bg-white mb-4 outline-none focus:ring-2 focus:ring-red-500 text-sm"
              rows="4"
              placeholder="E.g., Clause 4 states I must paint the house before leaving..."
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              required
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setShowDisputeForm(false)}
                className="px-4 py-2 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingDispute}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-70 text-sm"
              >
                {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Lawyer Chat */}
      {agreement && agreement.status !== 'uploaded' && (
        <ChatInterface documentText={agreement.extracted_text} />
      )}
    </div>
  );
};

// --- Processing State Component ---

const ProcessingState = ({ currentStatus, tip }) => {
  const stages = [
    { id: 'extracting', label: 'Extracting Text', icon: Layers },
    { id: 'analyzing', label: 'Analyzing Risks', icon: Brain },
    { id: 'finalizing', label: 'Finalizing Report', icon: CheckCircle2 },
  ];

  // Map sub-stages back to main stages for the UI
  let displayStatus = currentStatus;
  if (currentStatus.startsWith('analyzing page')) displayStatus = 'analyzing';

  const currentIndex = stages.findIndex(s => s.id === displayStatus);
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
        <p className="text-slate-600 text-sm font-bold animate-pulse">{currentStatus.replace('page', 'Page').replace('/', ' of ')}...</p>
      </div>

      <div className="w-full space-y-6">
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary-500 transition-all duration-1000 ease-in-out" 
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-[-30deg] animate-shimmer" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
                <span className={`text-[9px] font-black uppercase tracking-tighter ${
                  isActive ? 'text-slate-800' : 'text-slate-300'
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center space-x-2 text-primary-600 mb-2">
          <Info className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Did you know?</span>
        </div>
        <p className="text-slate-600 text-sm font-medium italic leading-relaxed min-h-[40px] flex items-center justify-center">
          {tip}
        </p>
      </div>
    </div>
  );
};

// --- Results Renderer ---

const AuditResultsRenderer = ({ result, status, onStartAudit, onScrollToClause }) => {
  if (!result || (typeof result === 'object' && (!result.results || result.results.length === 0))) {
    if (status === 'error') {
       return (
         <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
           <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
             <AlertTriangle className="w-8 h-8" />
           </div>
           <div className="space-y-1">
             <h4 className="font-bold text-slate-900">Audit Generation Failed</h4>
             <p className="text-xs text-slate-500">AI analysis is temporarily unavailable because the API quota has been exhausted, or the service timed out. Please try again later.</p>
           </div>
           <button 
             onClick={onStartAudit}
             className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow-md shadow-red-100"
           >
             Retry Analysis
           </button>
         </div>
       );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8 opacity-60">
        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center animate-pulse">
          <Brain className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Waiting for Results...</h4>
          <p className="text-xs text-slate-500 italic">No audit results available yet. Analysis may be in queue or starting.</p>
        </div>
      </div>
    );
  }

  let data;
  try {
    data = typeof result === 'string' ? JSON.parse(result) : result;
  } catch (e) {
    return (
      <div className="whitespace-pre-wrap prose prose-sm max-w-none text-slate-700 font-medium">
        {result}
      </div>
    );
  }

  const items = data.results || [data];
  const summary = data.overall_summary;
  const riskScore = data.risk_score || (items[0]?.risk_score);

  const quotaError = items.find(item => item.explanation?.simplified?.includes("API credits have been exhausted"));
  if (quotaError) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
          <CreditCard className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Credits Exhausted</h4>
          <p className="text-xs text-slate-500">Cannot perform analysis. Please check the notification or contact the admin.</p>
          <p className="text-xs text-primary-600 font-bold mt-2">Admin Contact Details : manishprojects0@gmail.com</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* New Agreement Summary Section */}
      {summary && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-400" />
              <h3 className="text-white font-bold text-sm tracking-tight">Agreement Summary</h3>
            </div>
            <div className="px-3 py-1 bg-white/10 rounded-full">
              <span className="text-primary-400 text-[10px] font-black uppercase">{summary.contract_type || 'Legal Audit'}</span>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-2 flex items-center">
                <Brain className="w-3.5 h-3.5 mr-2 text-primary-500" /> Executive Overview
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {summary.executive_summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-red-600 font-bold text-[10px] uppercase tracking-widest flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Key Red Flags
                </h4>
                <ul className="space-y-2">
                  {summary.key_red_flags?.map((flag, i) => (
                    <li key={i} className="flex items-start text-xs text-slate-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 mr-2 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-amber-600 font-bold text-[10px] uppercase tracking-widest flex items-center">
                  <CreditCard className="w-3.5 h-3.5 mr-2" /> Financial Concerns
                </h4>
                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">
                  {summary.financial_concerns}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {riskScore !== undefined && riskScore > 0 && (
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

      <div className="space-y-4">
        <h4 className="text-slate-900 font-bold flex items-center text-sm">
          <Zap className="w-4 h-4 mr-2 text-primary-500" /> Clause-by-Clause Analysis
        </h4>
        
        {items.map((item, idx) => (
          <RiskCard key={idx} item={item} onScrollToClause={onScrollToClause} />
        ))}
        
        {status.startsWith('analyzing page') && (
           <div className="flex items-center justify-center p-4 space-x-2 text-slate-400 italic text-xs border-2 border-dashed border-slate-100 rounded-xl">
             <RefreshCw className="w-3 h-3 animate-spin" />
             <span>More clauses coming soon...</span>
           </div>
        )}
      </div>

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

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('intellectual property') || cat.includes('ownership')) return Lightbulb;
    if (cat.includes('employment') || cat.includes('freelance')) return Briefcase;
    if (cat.includes('termination')) return AlertOctagon;
    if (cat.includes('confidentiality')) return EyeOff;
    if (cat.includes('non-compete')) return Ban;
    if (cat.includes('liability') || cat.includes('breach')) return ShieldAlert;
    if (cat.includes('arbitration') || cat.includes('jurisdiction')) return Scale;
    if (cat.includes('payment') || cat.includes('refund') || cat.includes('penalty')) return CreditCard;
    if (cat.includes('notice')) return Calendar;
    if (cat.includes('data privacy')) return Lock;
    if (cat.includes('renewal')) return RefreshCw;
    if (cat.includes('indemnification')) return ShieldCheck;
    if (cat.includes('charge') || cat.includes('fee')) return Search;
    if (cat.includes('duration') || cat.includes('term')) return Hourglass;
    return FileQuestion;
  };

  const level = item.risk_level || (item.verdict === 'NON_COMPLIANT' ? 'HIGH' : 'LOW');
  const CategoryIcon = getCategoryIcon(item.clause_category);

  // Helper to render **bold text** with red background highlighting
  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) => 
      i % 2 === 1 ? (
        <strong key={i} className="text-red-700 bg-red-100 px-1 rounded mx-0.5 whitespace-nowrap border border-red-200">
          {part}
        </strong>
      ) : part
    );
  };

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${getSeverityBg(level)} shadow-sm`}>
      <div 
        className="p-4 cursor-pointer flex flex-col space-y-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${getSeverityColors(level)}`}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm">
                {item.clause_category || 'Legal Clause'}
              </span>
              <div className="flex items-center mt-1 space-x-2">
                <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${getSeverityColors(level)}`}>
                  {level} RISK
                </div>
                {item.location?.page && (
                  <span className="px-1.5 py-0.5 bg-white/50 text-slate-500 text-[8px] font-bold rounded border border-slate-200/50">
                    PAGE {item.location.page}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-slate-600' : ''}`} />
        </div>
        
        {/* Short Summary inside the collapsed header */}
        {item.short_summary && (
          <p className="text-xs text-slate-600 font-medium pl-11">
            {item.short_summary}
          </p>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <hr className="border-slate-200/50 ml-11" />
          
          <div className="flex justify-end">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onScrollToClause(item.clause || item.explanation?.simplified); // fallback to text if clause isn't stored
              }}
              className="flex items-center px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-[9px] font-black transition-all hover:scale-105 shadow-sm"
            >
              <Zap className="w-3 h-3 mr-1.5 text-primary-500" /> JUMP TO CLAUSE
            </button>
          </div>

          <div className="space-y-1 pl-11">
            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Info className="w-3 h-3 mr-1.5" /> AI Interpretation
            </h5>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {renderFormattedText(item.explanation?.simplified || item.explanation)}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pl-11">
            <div className="space-y-1 p-3 bg-red-50 rounded-lg border border-red-100">
              <h5 className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1.5" /> Real-World Consequence
              </h5>
              <p className="text-[11px] text-red-900 leading-relaxed font-bold">
                {item.explanation?.why_it_risky || "This clause creates a significant legal or financial vulnerability for you."}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-white/60 rounded-lg border border-white">
              <h5 className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                <BookOpen className="w-3 h-3 mr-1.5" /> Law Reference
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {item.law_reference || "General Principles of Law"}
              </p>
            </div>
          </div>

          <div className="pl-11">
             <NegotiationSuggestion clause={item.clause || item.explanation?.simplified} />
          </div>

          {item.suggestion && (
             <div className="p-3 bg-white rounded-lg border border-green-200 shadow-sm space-y-2 ml-11">
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

// --- Negotiation AI Component ---

const NegotiationSuggestion = ({ clause }) => {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${RAG_URL}/api/rephrase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause_text: clause })
      });
      const data = await response.json();
      setSuggestion(data);
    } catch (error) {
      toast.error('Failed to generate negotiation advice');
    } finally {
      setIsLoading(false);
    }
  };

  if (!suggestion) {
    return (
      <button 
        onClick={fetchSuggestion}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-indigo-100 transition-all group"
      >
        <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'}`} />
        <span>{isLoading ? 'Consulting Negotiation AI...' : 'Suggest Fair Alternative'}</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm space-y-3 animate-in zoom-in-95 duration-300">
      <div className="flex items-center space-x-2 text-indigo-600">
        <Scale className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Balanced Suggestion</span>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-800 font-medium border border-slate-100 select-all cursor-copy hover:bg-slate-100 transition-colors" title="Click to copy">
        {suggestion.suggested_clause}
      </div>
      <p className="text-[10px] text-slate-500 italic leading-relaxed">
        <strong>Note:</strong> {suggestion.improvement_notes}
      </p>
      <button 
        onClick={() => {
          navigator.clipboard.writeText(suggestion.suggested_clause);
          toast.success('Clause copied to clipboard!');
        }}
        className="text-[9px] font-bold text-indigo-600 hover:underline"
      >
        Copy to clipboard
      </button>
    </div>
  );
};

const HighlightedText = ({ text, highlight, containerRef }) => {
  const [matchInfo, setMatchInfo] = useState(null);

  useEffect(() => {
    if (!highlight || !text) {
      setMatchInfo(null);
      return;
    }

    // 1. Try exact match first
    let index = text.indexOf(highlight);
    let length = highlight.length;

    // 2. Try whitespace-agnostic match (robust against PDF formatting artifacts)
    if (index === -1) {
      try {
        const escaped = highlight
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape special chars
          .replace(/\s+/g, '\\s+'); // allow any whitespace variation
        const regex = new RegExp(escaped, 'i'); // case-insensitive
        const match = regex.exec(text);
        if (match) {
          index = match.index;
          length = match[0].length;
        }
      } catch (e) {
        console.error("Regex matching failed", e);
      }
    }

    // 3. Last resort: partial start-of-sentence match
    if (index === -1 && highlight.length > 20) {
      const partial = highlight.substring(0, 30);
      index = text.indexOf(partial);
      length = Math.min(highlight.length, text.length - index);
    }

    if (index !== -1) {
      setMatchInfo({ index, length });
      
      // Auto-scroll with pinpoint precision
      setTimeout(() => {
        const mark = containerRef.current?.querySelector('mark');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      setMatchInfo(null);
    }
  }, [highlight, text]);

  if (!matchInfo || !text) return <>{text}</>;

  const { index, length } = matchInfo;
  const before = text.substring(0, index);
  const match = text.substring(index, index + length);
  const after = text.substring(index + length);

  return (
    <>
      {before}
      <mark className="bg-amber-100/80 text-slate-900 rounded-sm px-1 py-0.5 border-b-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-in fade-in zoom-in-95 duration-500 ring-1 ring-amber-200/50">
        {match}
      </mark>
      {after}
    </>
  );
};

export default AnalysisPage;
