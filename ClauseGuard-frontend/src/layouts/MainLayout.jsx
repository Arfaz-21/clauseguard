import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Upload, Shield, Settings2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const MainLayout = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Upload Contract', path: '/upload', icon: Upload },
    { name: 'Legal Generator', path: '/generator', icon: Sparkles },
    { name: 'Audit Policies', path: '/policies', icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Abstract Background inside Layout */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-primary-300 blur-3xl"></div>
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200 blur-3xl opacity-50"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/50 flex flex-col hidden md:flex z-10 shadow-lg shadow-slate-200/50">
        <div className="h-24 flex items-center px-8 border-b border-white/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">ClauseGuard</span>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-5 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-5 border-t border-white/40 bg-white/30 backdrop-blur-md m-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            {user.picture ? (
              <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full shadow-sm border border-white" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg border border-white shadow-sm">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-100 shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-20 glass border-b border-white/50 flex items-center justify-between px-6 md:hidden shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ClauseGuard</span>
          </div>
          <button onClick={logout} className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 hide-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
