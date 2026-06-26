import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Cpu, ShieldCheck } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    // Simulate sending recovery token
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-slow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-slow-pulse" style={{ animationDelay: '3s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-2xl text-white shadow-lg mb-4 glow-indigo">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Credentials</h2>
          <p className="text-xs text-slate-400 mt-1">Dispatches credential recovery credentials</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold uppercase tracking-wider text-xs">Recovery Key Sent</p>
                <p className="text-xs text-emerald-400/80 mt-1">
                  A verification token link has been dispatched to <strong>{email}</strong>. Check your inbox for reset instructions.
                </p>
              </div>
            </div>
            
            <Link 
              to="/login"
              className="flex items-center justify-center gap-2 py-3 w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-2xl border border-slate-700/60 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Access Portal</span>
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Admin Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 focus:border-indigo-500/80 rounded-2xl text-sm focus:outline-none transition-all placeholder:text-slate-600"
                  placeholder="developer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold rounded-2xl text-sm tracking-wide shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? "Generating Token..." : "Dispatch Password Reset"}
            </button>

            <Link 
              to="/login"
              className="flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-slate-200 text-xs transition-colors mt-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Portal</span>
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
