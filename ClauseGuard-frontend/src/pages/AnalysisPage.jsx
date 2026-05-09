import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agreementService } from '../services/agreementService';
import { disputeService } from '../services/disputeService';
import { useAuth } from '../context/AuthContext';
import { FileText, Clock, AlertTriangle, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react';
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
            <div className="px-6 py-4 border-b border-slate-200 bg-primary-50">
              <h3 className="font-bold text-primary-800 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2" /> AI Audit Results
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-slate-800 prose prose-sm max-w-none">
              {/* If the backend returns raw markdown, rendering it properly would be ideal, but for now we just show text. */}
              <div className="whitespace-pre-wrap">
                {agreement.audit_result || "No audit results provided by AI."}
              </div>
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

export default AnalysisPage;
