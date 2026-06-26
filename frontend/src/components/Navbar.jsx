import React from 'react';
import { useLocation } from 'react-router-dom';
import { Database, BrainCircuit, Activity, Cpu } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  // Map pathnames to beautiful titles
  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Engineering Dashboard';
      case '/analyze': return 'Incident Diagnostics';
      case '/history': return 'Resolution Ledger';
      case '/memory': return 'Hindsight Recall Explorer';
      case '/reports': return 'AI Operations Analytics';
      case '/admin': return 'Agent Administration';
      default: return 'AI Incident Response';
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          {getPageTitle(location.pathname)}
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Continuous runtime monitoring and persistent AI diagnostics
        </p>
      </div>

      {/* System Indicators */}
      <div className="hidden md:flex items-center gap-4">
        {/* DB Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 text-xs font-semibold">
          <Database className="w-3.5 h-3.5" />
          <span>DB: Atlas / Local JSON</span>
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        </div>

        {/* Hindsight Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/20 text-xs font-semibold">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Hindsight: Ready</span>
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
        </div>

        {/* Cascadeflow Router */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg border border-cyan-500/20 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>cascadeflow: Active</span>
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
