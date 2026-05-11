import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { agreementService } from '../services/agreementService';
import { Upload, File as FileIcon, X, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast.error('Please upload a valid PDF file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      console.log('Initiating upload for file:', file.name, 'Size:', file.size);
      const result = await agreementService.uploadAgreement(user.id, file);
      console.log('Upload successful! Response:', result);
      toast.success('Agreement uploaded successfully!');
      navigate(`/analysis/${result.id}`);
    } catch (error) {
      console.error('Upload Error Details:', error);
      
      let errorMsg = 'Please try again.';
      if (error.response && error.response.data && error.response.data.detail) {
        // Display specific backend error message
        errorMsg = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to the server. Please ensure the backend is running.';
      } else {
        errorMsg = error.message;
      }
      
      toast.error(`Upload failed: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 w-full pb-10">
      <header className="text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 mb-6 shadow-sm">
            <Upload size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Upload Agreement</h1>
          <p className="text-slate-500 mt-3 text-lg max-w-lg mx-auto">Upload your PDF lease contract for comprehensive AI analysis and risk detection.</p>
        </motion.div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card overflow-hidden shadow-xl shadow-slate-200/50"
      >
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="upload-zone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-10 md:p-16 text-center transition-all duration-300 cursor-pointer ${isDragActive ? 'bg-primary-50/50 border-2 border-primary-500 border-dashed' : 'bg-white border-2 border-slate-200 border-dashed hover:border-primary-300 hover:bg-slate-50/50'}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <motion.div 
                animate={{ y: isDragActive ? -10 : 0 }}
                className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
              >
                <Upload className="w-10 h-10" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Click or drag file here</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">Supported format: PDF only (Max 10MB). Your document will be securely encrypted.</p>
              <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 mx-auto">
                Select File from Computer
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf" 
                onChange={handleFileChange} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 md:p-12 bg-white"
            >
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-red-200">
                  <FileIcon className="w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-xl font-bold text-slate-900 mb-1 break-all">{file.name}</p>
                  <p className="text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center flex-shrink-0"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-primary-50/50 border border-primary-100 p-6 rounded-2xl mb-10 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Ready for Analysis</h4>
                  <p className="text-slate-600 leading-relaxed text-sm">Once uploaded, our AI will extract the text, analyze the clauses, and flag any hidden issues or unfair terms. This usually takes less than 30 seconds.</p>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/30 disabled:opacity-70 flex justify-center items-center group relative overflow-hidden"
              >
                {isUploading && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                )}
                {isUploading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    <span>Uploading & Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText size={20} />
                    <span>Upload and Analyze</span>
                    <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UploadPage;
