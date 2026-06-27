import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bar, 
  Line, 
  Pie 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  reportsAPI 
} from '../services/api';
import { 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Clock, 
  Database,
  Cpu,
  Brain,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const reportData = await reportsAPI.getReports();
        setData(reportData);
        setError(null);
      } catch (err) {
        console.error("Error loading dashboard reports:", err);
        setError("Failed to establish websocket telemetry link with api backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    
    // Live Cost Ticker Polling (every 10 seconds)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono tracking-wider animate-pulse">
          CONNECTING TELEMETRY HOOKS...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 max-w-lg mx-auto my-12 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
        <h3 className="font-bold">Telemetry Offline</h3>
        <p className="text-xs mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // --- Chart 1: Failure Categories (Bar Chart) ---
  const failureChartData = {
    labels: data.common_failures.map(item => item.category),
    datasets: [
      {
        label: 'Incident Occurrences',
        data: data.common_failures.map(item => item.count),
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1.5,
        borderRadius: 8,
      }
    ]
  };

  // --- Chart 2: Weekly Trends (Line Chart) ---
  const weeklyChartData = {
    labels: data.weekly_breakdown.map(item => item.week),
    datasets: [
      {
        label: 'Resolved',
        data: data.weekly_breakdown.map(item => item.resolved),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Unresolved',
        data: data.weekly_breakdown.map(item => item.unresolved),
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  // --- Chart 3: Model Usage (Doughnut Chart) ---
  const models = Object.keys(data.model_usage);
  const modelUsageChartData = {
    labels: models,
    datasets: [
      {
        data: models.map(m => data.model_usage[m]),
        backgroundColor: [
          'rgba(6, 182, 212, 0.7)',  // cyan
          'rgba(99, 102, 241, 0.7)', // indigo
          'rgba(168, 85, 247, 0.7)', // purple
          'rgba(236, 72, 153, 0.7)'  // pink
        ],
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
          font: { family: 'Outfit' }
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI: Total */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Total Audited</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{data.total_incidents}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-2xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Open */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Open Alerts</span>
            <span className="text-2xl font-extrabold text-rose-500 mt-1 block">{data.open_incidents}</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Resolved */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Resolved Cases</span>
            <span className="text-2xl font-extrabold text-emerald-500 mt-1 block">{data.resolved_incidents}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Critical */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Critical Priority</span>
            <span className="text-2xl font-extrabold text-amber-500 mt-1 block">{data.critical_incidents}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Avg resolution time */}
        <div className="glass-card flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Avg TTR</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{data.average_resolution_time_minutes}m</span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Stats Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-slate-300 relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        
        {/* Memory stat */}
        <div className="flex gap-4 items-start relative z-10 border-r border-slate-800/80 pr-4 last:border-0">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hindsight Recall</h4>
            <p className="text-lg font-bold text-white mt-0.5">{data.total_memories} Entries Saved</p>
            <p className="text-[10px] text-slate-500 mt-1">Automatic recall enabled on log analysis</p>
          </div>
        </div>

        {/* Cascadeflow routing stat - Live Ticker */}
        <div className="flex gap-4 items-start relative z-10 border-r border-slate-800/80 pr-4 last:border-0">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl animate-pulse">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live cascadeflow Telemetry</h4>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-xl font-bold text-white">${data.cascadeflow_cost_savings?.toFixed(4) || "0.0000"}</p>
               <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Saved</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live telemetry vs max-tier baseline
            </p>
          </div>
        </div>

        {/* Database state */}
        <div className="flex gap-4 items-start relative z-10">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telemetry Backend</h4>
            <p className="text-lg font-bold text-white mt-0.5">MongoDB Atlas</p>
            <p className="text-[10px] text-slate-500 mt-1">System database connection active</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Failures (2/3 width) */}
        <div className="glass-card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Failure Distribution</h3>
            <span className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold rounded-md">Categorized logs</span>
          </div>
          <div className="h-64">
            <Bar data={failureChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart: Model Routing (1/3 width) */}
        <div className="glass-card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">cascadeflow Model Shares</h3>
          <div className="h-56 flex items-center justify-center">
            <Pie data={modelUsageChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569',
                    font: { family: 'Outfit', size: 10 }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Weekly Trends (2/3 width) */}
        <div className="glass-card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Resolution Speed Trends</h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% resolved</span>
            </div>
          </div>
          <div className="h-64">
            <Line data={weeklyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Alerts (1/3 width) */}
        <div className="glass-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Activities</h3>
            <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
              <span>View Ledger</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[16.5rem] pr-1">
            {data.recent_activity.map((act) => (
              <div 
                key={act.id} 
                className="p-3 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl hover:border-slate-300 dark:hover:border-slate-700/60 transition-all cursor-pointer"
                onClick={() => navigate(`/history?search=${act.title}`)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1 pr-2">{act.title}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-semibold ${
                    act.severity === 'Critical' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                    act.severity === 'High' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                    'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                  }`}>
                    {act.severity}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[10px] text-slate-400 truncate">{act.created_by}</span>
                  <span className={`text-[10px] font-semibold ${act.status === 'Resolved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
