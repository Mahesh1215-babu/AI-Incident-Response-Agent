import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Cpu, Briefcase, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('engineer');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    
    const result = await signup(email, password, role);
    setLoading(false);
    
    if (result.success) {
      setSuccessMsg("Registration successful! Redirecting to login portal...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setErrorMsg(result.error);
    }
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
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-2xl text-white shadow-lg mb-4 glow-indigo">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Security Profile</h2>
          <p className="text-xs text-slate-400 mt-1">Register operational access credentials</p>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm"
          >
            <p className="font-semibold text-xs uppercase tracking-wider">Registration Failed</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-start gap-2"
          >
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider">Success</p>
              <p className="text-xs mt-0.5">{successMsg}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
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

          {/* Role Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Operational Role</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 focus:border-indigo-500/80 rounded-2xl text-sm focus:outline-none transition-all text-slate-300 appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="engineer">Site Reliability Engineer (SRE)</option>
                <option value="admin">Administrator / DevOps Manager</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-11 pr-11 py-3 bg-slate-900/60 border border-slate-700/60 focus:border-indigo-500/80 rounded-2xl text-sm focus:outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 focus:border-indigo-500/80 rounded-2xl text-sm focus:outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold rounded-2xl text-sm tracking-wide shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? "Registering Credentials..." : "Register Credentials"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-medium">Access Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
