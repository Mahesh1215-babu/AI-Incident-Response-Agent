import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import { ArrowRight, CheckCircle, Clock, DollarSign, BrainCircuit, Activity } from 'lucide-react';

const MemoryDelta = () => {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [delta, setDelta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDelta = async (e) => {
    e.preventDefault();
    if (!id1 || !id2) return;
    try {
      setLoading(true);
      setError(null);
      const data = await reportsAPI.getMemoryDelta(id1, id2);
      setDelta(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch memory delta comparison. Ensure both IDs exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Memory Delta Comparison</h2>
        <p className="text-sm text-slate-400 mb-6">
          Compare two incident diagnostics side-by-side to observe the impact of Hindsight memory on cascadeflow routing latency, cost, and accuracy.
        </p>

        <form onSubmit={fetchDelta} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Interaction 1 (Without Memory)</label>
            <input 
              type="text" 
              value={id1}
              onChange={e => setId1(e.target.value)}
              placeholder="Incident ID 1"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex items-center justify-center mb-2 px-2">
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Interaction 2 (With Memory)</label>
            <input 
              type="text" 
              value={id2}
              onChange={e => setId2(e.target.value)}
              placeholder="Incident ID 2"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !id1 || !id2}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </form>

        {error && <div className="mt-4 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">{error}</div>}
      </div>

      {delta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Incident 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Baseline: {delta.incident_1.title}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> Hindsight Hit</span>
                <span className={delta.hit_1 ? "text-emerald-400 font-medium" : "text-slate-500"}>{delta.hit_1 ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Routing Model</span>
                <span className="text-white font-medium text-right text-sm">{delta.incident_1.model_used || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Latency</span>
                <span className="text-white font-medium">{delta.latency_1.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Cost</span>
                <span className="text-white font-medium">${delta.cost_1.toFixed(6)}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Diagnosis</h4>
              <p className="text-sm text-slate-300 line-clamp-3">{delta.incident_1.summary}</p>
            </div>
          </div>

          {/* Incident 2 */}
          <div className="bg-slate-900 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
            <h3 className="text-lg font-bold text-white mb-4 relative z-10">Optimized: {delta.incident_2.title}</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> Hindsight Hit</span>
                <span className={delta.hit_2 ? "text-emerald-400 font-medium" : "text-slate-500"}>{delta.hit_2 ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Routing Model</span>
                <span className="text-white font-medium text-right text-sm">{delta.incident_2.model_used || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Latency</span>
                <span className="text-emerald-400 font-medium">{delta.latency_2.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Cost</span>
                <span className="text-emerald-400 font-medium">${delta.cost_2.toFixed(6)}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-800 pt-4 relative z-10">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Diagnosis</h4>
              <p className="text-sm text-slate-300 line-clamp-3">{delta.incident_2.summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryDelta;
