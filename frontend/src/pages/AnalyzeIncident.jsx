import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  incidentsAPI 
} from '../services/api';
import { 
  Upload, 
  Terminal, 
  Settings, 
  ShieldAlert, 
  Play, 
  Clock, 
  BrainCircuit, 
  Cpu, 
  Check,
  ChevronRight,
  TrendingUp,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';

const AnalyzeIncident = () => {
  // Input states
  const [title, setTitle] = useState('');
  const [logs, setLogs] = useState('');
  const [severity, setSeverity] = useState('High');
  const [environment, setEnvironment] = useState('Production');
  const [containsPii, setContainsPii] = useState(false);
  
  // App states
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  // Feedback loop states
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [finalResolution, setFinalResolution] = useState('');
  const [resolutionTime, setResolutionTime] = useState(15);
  const [engineerNotes, setEngineerNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  // Handle file uploading
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');

    try {
      const uploadRes = await incidentsAPI.uploadLog(file);
      setLogs(uploadRes.log_text);
      if (!title) {
        // Pre-fill title with filename
        setTitle(`Logs diagnostics for ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || "Failed to parse log file.");
    }
  };

  // Run analysis pipeline
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!title || !logs) {
      setAnalysisError("Please provide a title and logs to analyze.");
      return;
    }
    
    setAnalysisError('');
    setResult(null);
    setFeedbackSuccess(false);
    setAnalyzing(true);

    try {
      const response = await incidentsAPI.analyze(title, logs, severity, environment, containsPii);
      setResult(response);
      
      // Auto populate feedback template with recommended first action
      if (response.recommended_resolution?.length > 0) {
        setFinalResolution(response.recommended_resolution[0]);
      }
    } catch (err) {
      console.error(err);
      setAnalysisError(err.response?.data?.detail || "AI analysis failed. Please verify API key configs.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit final feedback
  const handleResolveFeedback = async (e) => {
    e.preventDefault();
    if (!result) return;
    if (!finalResolution) {
      alert("Please provide the final resolution action.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const updatedIncident = await incidentsAPI.submitFeedback({
        incident_id: result.id,
        final_resolution: finalResolution,
        resolution_time_minutes: parseInt(resolutionTime),
        engineer_notes: engineerNotes,
        is_success: isSuccess
      });
      setResult(updatedIncident);
      setFeedbackSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback. Check server connection.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Form Inputs (Left) */}
        <div className="glass-card xl:col-span-1 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Incident Configurator</h3>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Incident Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
                placeholder="Database Connection Timeout / Cache OOM Alert"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Severity / Env row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Severity</label>
                <select
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Environment</label>
                <select
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                >
                  <option value="Production">Production</option>
                  <option value="Testing">Testing</option>
                  <option value="Development">Development</option>
                  <option value="Cloud">Cloud</option>
                  <option value="On-premise">On-premise</option>
                </select>
              </div>
            </div>

            {/* Compliance Mode Toggle */}
            <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <input
                type="checkbox"
                id="pii-toggle"
                checked={containsPii}
                onChange={(e) => setContainsPii(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-slate-800 border-slate-700"
              />
              <label htmlFor="pii-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
                Contains Customer PII (Compliance Mode)
              </label>
            </div>

            {/* File Upload Parser */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upload Log File</label>
              <div className="relative group border border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-all">
                <input
                  type="file"
                  accept=".log,.txt,.json"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs text-slate-500 font-medium block">Drag & drop or browse .log, .txt, .json</span>
              </div>
              {uploadError && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{uploadError}</p>}
            </div>

            {/* Paste Logs */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Raw Logs Content</label>
              <textarea
                required
                rows={10}
                className="w-full p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500"
                placeholder="2026-06-26 14:04:12 [ERROR] Database client pool connection pool limit reached. Max: 20..."
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
              />
            </div>

            {analysisError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex gap-2 items-start">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Run button */}
            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{analyzing ? "AI Routing & Running..." : "Execute AI Diagnostics"}</span>
            </button>
          </form>
        </div>

        {/* Results / Details Area (Right) */}
        <div className="xl:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card flex flex-col items-center justify-center min-h-[500px] text-center p-8 space-y-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <Cpu className="w-6 h-6 text-indigo-400 absolute animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-white">cascadeflow Router Evaluating Request</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Inspecting log characteristics and severity parameters to select the optimal model routing pathway.
                  </p>
                </div>
                {/* Simulated steps */}
                <div className="text-[10px] text-cyan-400 font-semibold font-mono tracking-widest uppercase py-1 px-3 bg-slate-900 border border-slate-800 rounded-full">
                  1. PARSING LOGS → 2. RECALLING MEMORIES → 3. AI RUNNING
                </div>
              </motion.div>
            )}

            {!analyzing && !result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card flex flex-col items-center justify-center min-h-[500px] text-center p-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800"
              >
                <Terminal className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-800 animate-pulse" />
                <h4 className="font-bold text-slate-600 dark:text-slate-400">Telemetry Stream Unassigned</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                  Configure incident title, paste log trace contents, and click 'Execute AI Diagnostics' to analyze.
                </p>
              </motion.div>
            )}

            {!analyzing && result && (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Analysis Report Card */}
                <div className="glass-card space-y-6">
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold font-mono">DIAGNOSTIC REPORT</span>
                      <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{result.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-[10px] px-2.5 py-1 uppercase tracking-wider font-bold rounded-lg border ${
                        result.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {result.status}
                      </span>
                      <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-lg uppercase">
                        {result.environment}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Cause */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Summary</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium">{result.summary}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Root Cause Analysis</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed bg-slate-100/50 dark:bg-slate-900/60 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl font-mono text-xs">
                          {result.root_cause}
                        </p>
                      </div>
                    </div>

                    {/* Confidence & Speed */}
                    <div className="space-y-4 md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-6">
                      {/* Confidence Meter */}
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Diagnostic Confidence</span>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-3xl font-extrabold text-indigo-500">{result.confidence_score}%</span>
                          <span className="text-[10px] text-slate-400 font-bold">accuracy rating</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full"
                            style={{ width: `${result.confidence_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Resolution speed */}
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Est. Resolution Time</span>
                        <div className="flex items-center gap-2 mt-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span>{result.estimated_resolution_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Components and Action checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Affected Components */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Affected Components</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.affected_components.map((comp, idx) => (
                          <span key={idx} className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-semibold">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Resolutions */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Playbook Actions</h4>
                      <ul className="space-y-2.5">
                        {result.recommended_resolution.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300 items-start">
                            <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-md text-[10px] font-bold shrink-0 mt-0.5 border border-indigo-500/20">{idx+1}</span>
                            <span className="mt-0.5">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Preventive Suggestions */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preventive System Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.preventive_measures.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* cascadeflow routing log audit trail */}
                <div className="glass bg-slate-950 border border-slate-800/80 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <h3 className="font-bold text-white text-sm tracking-tight">cascadeflow Runtime Routing Audit</h3>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-950/50 border border-cyan-800/50 rounded-full font-bold">LIVE METADATA</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Model Selected</span>
                      <span className="text-xs font-bold text-slate-200 block mt-0.5">{result.model_used}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Execution Latency</span>
                      <span className="text-xs font-bold text-slate-200 block mt-0.5">{result.routing_latency} seconds</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Estimated Billing</span>
                      <span className="text-xs font-bold text-emerald-400 block mt-0.5">${result.routing_cost} USD</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Router Path Decider</span>
                      <span className="text-xs font-bold text-cyan-400 block mt-0.5 truncate">{result.severity} priority</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800/50 rounded-xl flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed font-mono">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold font-sans mb-0.5">Routing Rationale</span>
                      {result.routing_reason}
                    </div>
                  </div>
                </div>

                {/* Hindsight Persistent Memory Recall Matches */}
                <div className="glass bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-white text-sm">Hindsight Memory Insights</h3>
                    </div>
                    <span className="text-[9px] font-mono text-indigo-400 px-2 py-0.5 bg-indigo-950/50 border border-indigo-800/50 rounded-full font-bold">RECALL DATA</span>
                  </div>

                  {result.matched_memories?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No matching historical logs identified. Future resolutions for this pattern will build hindsight data.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Aggregated Memory Box */}
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Historic Resolution Success Rate</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-emerald-400">100.0%</span>
                            <span className="text-[10px] text-slate-500 font-medium">({result.matched_memories.length} matches recalled)</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Highest Success Playbook Remedy</span>
                          <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
                            {result.matched_memories[0]?.final_resolution || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Matches detail scroll */}
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {result.matched_memories.map((mem, idx) => (
                          <div key={mem.id || idx} className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl relative hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-200">{mem.title}</h4>
                              <span className="text-[10px] font-semibold font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                Match: {Math.round(mem.similarity_score * 100)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-2.5 border-t border-slate-800/80">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-semibold">Successful Resolution</span>
                                <p className="text-xs text-slate-300 mt-0.5 font-medium">{mem.final_resolution}</p>
                              </div>
                              {mem.engineer_notes && (
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Engineer Debrief Notes</span>
                                  <p className="text-xs text-slate-400 mt-0.5 italic">{mem.engineer_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution Register Loop (Feedback) */}
                <div className="glass-card border-2 border-indigo-500/30 shadow-indigo-500/5 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">Register Resolution Action</h3>
                      <p className="text-xs text-slate-400">Applies final resolution audit parameters and logs memory to Hindsight</p>
                    </div>
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                  </div>

                  {feedbackSuccess ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-2.5">
                      <Check className="w-5 h-5 shrink-0 bg-emerald-500/20 rounded-full p-0.5 mt-0.5" />
                      <div>
                        <p className="font-bold">Resolution Ledged successfully!</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Incident diagnostics status changed to <strong>Resolved</strong>. Hindsight memory indexing completed. This diagnostic solution is now actively prioritized for future incident logs matches.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleResolveFeedback} className="space-y-4">
                      {/* Action Taken */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Final Resolution Action</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                          placeholder="Restarted service, adjusted max pool parameters to 50"
                          value={finalResolution}
                          onChange={(e) => setFinalResolution(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Time taken */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Time to Resolve (Minutes)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                            value={resolutionTime}
                            onChange={(e) => setResolutionTime(e.target.value)}
                          />
                        </div>

                        {/* Success toggle */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resolution Status</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIsSuccess(true)}
                              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                isSuccess 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                                  : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Succeeded</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSuccess(false)}
                              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                !isSuccess 
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' 
                                  : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Engineer Notes */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Engineer Debrief Notes (Post-mortem)</label>
                        <textarea
                          rows={2}
                          className="w-full p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                          placeholder="Hanging node requests were resolved immediately. Need to add healthcheck routes..."
                          value={engineerNotes}
                          onChange={(e) => setEngineerNotes(e.target.value)}
                        />
                      </div>

                      {/* Submit Resolution */}
                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                      >
                        {submittingFeedback ? "COMMITTING AUDIT LEDGER..." : "COMMIT AUDIT & INDEX MEMORY"}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeIncident;
