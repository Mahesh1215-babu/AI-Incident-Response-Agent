import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  reportsAPI 
} from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Terminal, 
  BrainCircuit, 
  Settings, 
  Cpu, 
  Database, 
  Activity, 
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

const AdminPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const adminData = await reportsAPI.getAdminAnalytics();
        setData(adminData);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch administrative diagnostics. Ensure you have administrator rights.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-2">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-mono tracking-wider animate-pulse uppercase">Bootstrapping Admin Console...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 max-w-lg mx-auto my-12 text-center">
        <ShieldCheck className="w-8 h-8 mx-auto mb-3" />
        <h3 className="font-bold">Access Denied</h3>
        <p className="text-xs mt-1">{error || "Administrative rights validation error."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* System Health Indicators */}
      <div className="glass-card space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>Infrastructure Health Indicators</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Live sub-system diagnostic states and hardware metrics</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
          {/* DB */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Database Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.system_status.database}</span>
            </div>
          </div>

          {/* Memory */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Hindsight memory</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.system_status.hindsight_engine}</span>
            </div>
          </div>

          {/* Router */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">cascadeflow router</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.system_status.cascadeflow_router}</span>
            </div>
          </div>

          {/* API */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">REST API Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.system_status.api_health}</span>
            </div>
          </div>

          {/* Uptime */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">System Uptime</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.system_status.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Registered Engineers</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{data.users_count}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Incidents */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Incident Audits</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{data.incidents_count}</span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-2xl">
            <Terminal className="w-5 h-5" />
          </div>
        </div>

        {/* Memories */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Indexed Memories</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{data.memories_count}</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
            <BrainCircuit className="w-5 h-5" />
          </div>
        </div>

        {/* Audit Logs */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Audit Logs Recorded</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{data.audit_logs_count}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Users directory table */}
      <div className="glass-card space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Registered SRE Accounts Directory</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage permissions and view secure authentication profiles</p>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-4">Account ID</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Operational Role</th>
                <th className="p-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {data.users_list.map((u) => (
                <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="p-4 font-mono text-[10px] text-slate-500">{u.id}</td>
                  <td className="p-4 font-bold">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                      u.role === 'admin' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(u.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
