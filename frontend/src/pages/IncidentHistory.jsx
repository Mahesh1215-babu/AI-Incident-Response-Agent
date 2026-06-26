import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  incidentsAPI 
} from '../services/api';
import { 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Clock,
  Printer,
  X,
  FileText,
  User,
  Activity,
  Cpu,
  BrainCircuit
} from 'lucide-react';

const IncidentHistory = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // List states
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [severity, setSeverity] = useState('All');
  const [environment, setEnvironment] = useState('All');
  const [status, setStatus] = useState('All');
  
  // Detail views state
  const [expandedId, setExpandedId] = useState(null);
  
  // PDF/Print report state
  const [printIncident, setPrintIncident] = useState(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentsAPI.getIncidents({
        search: search || undefined,
        severity: severity !== 'All' ? severity : undefined,
        environment: environment !== 'All' ? environment : undefined,
        status: status !== 'All' ? status : undefined,
      });
      setIncidents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch historical incidents ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severity, environment, status]); // Trigger fetch on select filter change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this incident report?")) {
      return;
    }
    try {
      await incidentsAPI.deleteIncident(id);
      setIncidents(incidents.filter(inc => inc.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Delete operation failed.");
    }
  };

  const handlePrintPostMortem = (inc, e) => {
    e.stopPropagation();
    setPrintIncident(inc);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters Bar */}
      <div className="glass-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents ledger by title, logs content, or root cause..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Search
          </button>
        </form>

        {/* Filter selects row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[70px]">Status</span>
            <select
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Severity */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[70px]">Severity</span>
            <select
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Env */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[70px]">Environment</span>
            <select
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option value="All">All Environments</option>
              <option value="Production">Production</option>
              <option value="Testing">Testing</option>
              <option value="Development">Development</option>
              <option value="Cloud">Cloud</option>
              <option value="On-premise">On-premise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase animate-pulse">Syncing Ledger...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="glass-card text-center py-16 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-800" />
          <h4 className="font-bold">No Records Found</h4>
          <p className="text-xs mt-0.5">Try altering filters or search arguments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => {
            const isExpanded = expandedId === inc.id;
            return (
              <div 
                key={inc.id}
                className="glass-card hover:border-slate-300 dark:hover:border-slate-800/80 cursor-pointer overflow-hidden p-0"
                onClick={() => setExpandedId(isExpanded ? null : inc.id)}
              >
                {/* Header row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold rounded border ${
                        inc.severity === 'Critical' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                        inc.severity === 'High' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' :
                        inc.severity === 'Medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/25'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{inc.environment}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mt-1.5 leading-snug">{inc.title}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 shrink-0">
                    <div className="text-right">
                      <span className={`text-[10px] uppercase font-bold block ${
                        inc.status === 'Resolved' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {inc.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {new Date(inc.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-4">
                      {/* Print PDF Post-mortem */}
                      <button
                        onClick={(e) => handlePrintPostMortem(inc, e)}
                        className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                        title="Print / Save PDF Post-mortem"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      {user && user.role === 'admin' && (
                        <button
                          onClick={(e) => handleDelete(inc.id, e)}
                          className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                          title="Delete Incident Ledger File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Toggle Expand icon */}
                      <div className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
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
                        {/* Summary / Root Cause */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI DIAGNOSTIC SUMMARY</h4>
                              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">{inc.summary || "Pending diagnosis."}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ROOT CAUSE DETERMINATION</h4>
                              <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl leading-relaxed">
                                {inc.root_cause || "Pending diagnosis."}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4 md:border-l md:border-slate-200 dark:md:border-slate-800/80 md:pl-6 text-xs text-slate-400">
                            <div>
                              <span className="font-bold uppercase text-[10px] tracking-wider text-slate-400 block mb-1">Audit Metadata</span>
                              <div className="space-y-2 font-medium">
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 py-1">
                                  <span>Incident ID:</span>
                                  <span className="font-mono text-[10px] font-semibold text-slate-200">{inc.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 py-1">
                                  <span>Triggered By:</span>
                                  <span>{inc.created_by}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 py-1">
                                  <span>Confidence:</span>
                                  <span className="text-indigo-400 font-bold">{inc.confidence_score || 0}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Logs */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SYSTEM LOG BUFFER</h4>
                          <pre className="p-4 bg-slate-150 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed text-slate-600 dark:text-slate-300">
                            {inc.logs}
                          </pre>
                        </div>

                        {/* cascadeflow Routing trail detail */}
                        {inc.model_used && (
                          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                              <Cpu className="w-4 h-4 animate-pulse" />
                              <span>cascadeflow Router Execution Details</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase">routed Model</span>
                                <span className="text-slate-300 mt-0.5 block">{inc.model_used}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase">API latency</span>
                                <span className="text-slate-300 mt-0.5 block">{inc.routing_latency} seconds</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase">Routing Cost</span>
                                <span className="text-emerald-500 mt-0.5 block">${inc.routing_cost}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase">Decision Rationale</span>
                                <span className="text-cyan-400 mt-0.5 block truncate max-w-[200px]" title={inc.routing_reason}>{inc.routing_reason}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Resolution & Post-Mortem Feedback detail */}
                        {inc.status === 'Resolved' && (
                          <div className="p-5 bg-indigo-500/5 border-l-4 border-indigo-500 rounded-xl space-y-4">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">RESOLVED PLAYBOOK POST-MORTEM</h4>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Resolved in {inc.resolution_time_minutes} mins</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Verified Action Taken</span>
                                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{inc.final_resolution}</p>
                                </div>
                                {inc.engineer_notes && (
                                  <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Engineer Debrief Notes</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 italic">{inc.engineer_notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CSS Hide Print Mode Layout Frame --- */}
      {printIncident && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans space-y-6 z-[9999]">
          <div className="border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-tight">AI Incident Post-Mortem Report</h1>
            <p className="text-sm text-gray-500 mt-1">Generated by Hindsight & cascadeflow Intelligence System</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-4 border-b border-gray-200">
            <div>
              <p><strong className="uppercase">Incident ID:</strong> {printIncident.id}</p>
              <p className="mt-1"><strong className="uppercase">Title:</strong> {printIncident.title}</p>
              <p className="mt-1"><strong className="uppercase">Date Occurred:</strong> {new Date(printIncident.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p><strong className="uppercase">Operational Status:</strong> {printIncident.status}</p>
              <p className="mt-1"><strong className="uppercase">Severity Priority:</strong> {printIncident.severity}</p>
              <p className="mt-1"><strong className="uppercase">Deployment Environment:</strong> {printIncident.environment}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <h4 className="text-sm font-bold border-b border-black pb-1 uppercase">AI Diagnostic Summary</h4>
              <p className="text-xs text-gray-700 mt-1.5">{printIncident.summary}</p>
            </div>

            <div>
              <h4 className="text-sm font-bold border-b border-black pb-1 uppercase">Root Cause Analysis</h4>
              <p className="text-xs text-gray-700 mt-1.5 font-mono bg-gray-50 p-3 rounded">{printIncident.root_cause}</p>
            </div>

            {printIncident.status === 'Resolved' && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold border-b border-black pb-1 uppercase">Operational Remedy (Post-mortem)</h4>
                <div className="text-xs text-gray-700">
                  <p><strong>Remedy Executed:</strong> {printIncident.final_resolution}</p>
                  <p className="mt-1"><strong>Time-to-Resolve:</strong> {printIncident.resolution_time_minutes} Minutes</p>
                  {printIncident.engineer_notes && <p className="mt-1"><strong>Engineer Post-mortem notes:</strong> {printIncident.engineer_notes}</p>}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold border-b border-black pb-1 uppercase">System Log Trail</h4>
              <pre className="text-[10px] font-mono bg-gray-50 p-4 border rounded max-h-[300px] overflow-hidden whitespace-pre-wrap mt-2">
                {printIncident.logs}
              </pre>
            </div>
          </div>

          <div className="border-t border-black pt-6 text-center text-[10px] text-gray-500 font-mono">
            Signed off by operational engineer: {printIncident.created_by}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentHistory;
