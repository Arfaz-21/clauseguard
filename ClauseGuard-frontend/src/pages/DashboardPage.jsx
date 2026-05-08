import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agreementService } from '../services/agreementService';
import { alertService } from '../services/alertService';
import { useAuth } from '../context/AuthContext';
import { FileText, Bell, Clock, CheckCircle, AlertTriangle, FileSearch, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [agreementsData, alertsData] = await Promise.all([
          agreementService.getTenantAgreements(user.id),
          alertService.getUserAlerts(user.id)
        ]);
        setAgreements(agreementsData);
        setAlerts(alertsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'uploaded': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'audited': return <FileSearch className="w-5 h-5 text-blue-500" />;
      case 'signed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'uploaded': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 backdrop-blur-sm border border-amber-200/50 shadow-sm">Pending Audit</span>;
      case 'audited': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 backdrop-blur-sm border border-blue-200/50 shadow-sm">Audited</span>;
      case 'signed': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100/80 text-green-800 backdrop-blur-sm border border-green-200/50 shadow-sm">Signed</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100/80 text-slate-800 backdrop-blur-sm border border-slate-200/50 shadow-sm">{status}</span>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-2 text-lg">Here's an overview of your contracts and security alerts.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Link to="/upload" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/30 hover:-translate-y-0.5">
            <FileText size={18} />
            <span>Upload Contract</span>
          </Link>
        </motion.div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-3 gap-6"
      >
        {/* Stat Cards */}
        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mr-5 shadow-sm border border-blue-100">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Agreements</p>
            <p className="text-3xl font-extrabold text-slate-900">{agreements.length}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mr-5 shadow-sm border border-amber-100">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Audits</p>
            <p className="text-3xl font-extrabold text-slate-900">{agreements.filter(a => a.status === 'uploaded').length}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors"></div>
          <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center text-red-600 mr-5 shadow-sm border border-red-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Active Alerts</p>
            <p className="text-3xl font-extrabold text-slate-900">{alerts.length}</p>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-primary-500" size={20} />
              <h2 className="text-xl font-bold text-slate-900">Recent Agreements</h2>
            </div>
            <Link to="/agreements" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="glass-card overflow-hidden">
            {agreements.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No agreements yet</h3>
                <p className="mb-4 text-sm">Upload your first contract to get started with AI analysis.</p>
                <Link to="/upload" className="text-primary-600 font-medium hover:underline">Upload Contract &rarr;</Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200/50">
                {agreements.map((agreement) => (
                  <motion.li 
                    key={agreement.id} 
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                    className="p-5 transition-colors"
                  >
                    <Link to={`/analysis/${agreement.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mr-5 group-hover:scale-105 transition-transform">
                          {getStatusIcon(agreement.status)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg mb-0.5 group-hover:text-primary-600 transition-colors">
                            {agreement.file_path ? agreement.file_path.split('_').pop() : `Agreement #${agreement.id}`}
                          </p>
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">ID: {agreement.id}</p>
                            {getStatusBadge(agreement.status)}
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <ArrowRight size={20} />
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Bell className="text-primary-500" size={20} />
            <h2 className="text-xl font-bold text-slate-900">Recent Alerts</h2>
          </div>
          
          <div className="glass-card overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">All clear</p>
                <p className="text-xs">No active alerts at the moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200/50">
                {alerts.map((alert) => (
                  <li key={alert.id} className="p-5 flex items-start hover:bg-slate-50/50 transition-colors">
                    <div className="relative mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full mr-4 ${alert.sent === 'pending' ? 'bg-amber-500' : 'bg-green-500'}`} />
                      {alert.sent === 'pending' && (
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping opacity-75"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{alert.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs font-medium text-slate-500">{new Date(alert.alert_date).toLocaleDateString()}</p>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                          {alert.alert_type}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
