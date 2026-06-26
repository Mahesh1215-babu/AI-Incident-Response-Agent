import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  memoryAPI 
} from '../services/api';
import { 
  Search, 
  BrainCircuit, 
  Database, 
  Server, 
  Cpu, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ChevronUp, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

const MemoryExplorer = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  // Expanded item state
  const [expandedId, setExpandedId] = useState(null);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const data = await memoryAPI.search(query, filterType);
      setMemories(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to query hindsight memory database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [filterType]); // Fetch immediately when filter selection changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMemories();
  };

  // Compute memory statistics
  const totalCount = memories.length;
  const successCount = memories.filter(m => m.is_success !== false).length;
  const successRate = totalCount ? ((successCount / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 pb-12">
      {/* Memory Index Header Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-slate-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        
        {/* Total Memories */}
        <div className="flex gap-4 items-start relative z-10 border-r border-slate-800/80 pr-4 last:border-0">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Memory Size</h4>
            <p className="text-lg font-bold text-white mt-0.5">{totalCount} Vectors Indexed</p>
            <p className="text-[10px] text-slate-500 mt-1">Incremental post-mortem learning active</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="flex gap-4 items-start relative z-10 border-r border-slate-800/80 pr-4 last:border-0">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolution Efficiency</h4>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{successRate}% Success</p>
            <p className="text-[10px] text-slate-500 mt-1">Ratio of verified successful resolves</p>
          </div>
        </div>

        {/* Database Store */}
        <div className="flex gap-4 items-start relative z-10">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Persistence Engine</h4>
            <p className="text-lg font-bold text-white mt-0.5">Vector Space Index</p>
            <p className="text-[10px] text-slate-500 mt-1">Keyword-to-Text cosine similarity matrix</p>
          </div>
        </div>
      </div>

      {/* Query Filter and Search Controls */}
      <div className="glass-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search persistent hindsight memories (e.g. database client, OOM, volatile-lru)..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Query Memory
          </button>
        </form>

        {/* Categories toggler */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Tags Categories:</span>
          <div className="flex gap-2">
            {[
              { label: 'All Vectors', val: 'All', icon: Layers },
              { label: 'Database Node', val: 'Database', icon: Database },
              { label: 'Server Engine', val: 'Server', icon: Server },
              { label: 'Application Cache', val: 'Application', icon: Cpu }
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.val}
                  onClick={() => setFilterType(btn.val)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    filterType === btn.val
                      ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30 font-bold'
                      : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Memory ledger list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase animate-pulse">Scanning Memory Space...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="glass-card text-center py-16 text-slate-400">
          <BrainCircuit className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-800" />
          <h4 className="font-bold">Hindsight Memory Empty</h4>
          <p className="text-xs mt-0.5">Submit resolution feedbacks in Incident Diagnostics to index memories.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map((mem, index) => {
            const isExpanded = expandedId === mem.id;
            const isMemSuccess = mem.is_success !== false;
            
            return (
              <div 
                key={mem.id || index}
                className="glass-card hover:border-slate-300 dark:hover:border-slate-800/80 cursor-pointer overflow-hidden p-0"
                onClick={() => setExpandedId(isExpanded ? null : mem.id)}
              >
                {/* Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2.5">
                      {isMemSuccess ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                          <CheckCircle className="w-3 h-3" />
                          <span>Successful Fix</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                          <XCircle className="w-3 h-3" />
                          <span>Failed Fix Attempt</span>
                        </span>
                      )}
                      
                      {/* Similarity badge */}
                      {mem.similarity_score !== undefined && mem.similarity_score < 1.0 && (
                        <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-semibold">
                          Cosine Similarity: {Math.round(mem.similarity_score * 100)}%
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">{mem.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-semibold text-slate-400">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(mem.timestamp || mem.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-cyan-400 block font-semibold mt-0.5">
                        TTR: {mem.resolution_time_minutes}m
                      </span>
                    </div>

                    <div className="p-2 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Diagnostic diagnosis */}
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indexed Root Cause</h4>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl leading-relaxed">
                              {mem.root_cause}
                            </p>
                          </div>

                          {/* Resolution remedy */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied Solution Remedy</h4>
                              <div className="mt-1.5 p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-start gap-2.5">
                                <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-700 dark:text-slate-200 font-bold leading-normal">{mem.final_resolution}</p>
                              </div>
                            </div>
                            
                            {mem.engineer_notes && (
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Post-mortem Notes</h4>
                                <div className="mt-1.5 p-3.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-500 dark:text-slate-400 italic">
                                  "{mem.engineer_notes}"
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recommendation details checklist */}
                        {mem.recommended_solution?.length > 0 && (
                          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historic Playbook Actions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {mem.recommended_solution.map((sol, index) => (
                                <div key={index} className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">{index+1}</span>
                                  <span>{sol}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Logs excerpt */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Logs Signature Excerpt</h4>
                          <pre className="p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto text-slate-600 dark:text-slate-400">
                            {mem.logs}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemoryExplorer;
