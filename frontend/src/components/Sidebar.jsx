import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Terminal, 
  History, 
  BrainCircuit, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  Sun, 
  Moon, 
  Cpu
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, theme, toggleTheme } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analyze Incident', path: '/analyze', icon: Terminal },
    { name: 'Incident History', path: '/history', icon: History },
    { name: 'Memory Explorer', path: '/memory', icon: BrainCircuit },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  // Add Admin Panel item if current user is admin
  if (user && user.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-400">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-xl text-white shadow-lg glow-indigo">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-md font-bold text-white tracking-tight leading-none">Incident Response</h1>
          <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Hindsight Memory</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-white border-l-4 border-indigo-500 pl-3 font-semibold'
                    : 'hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
          <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full font-bold text-xs uppercase border border-indigo-500/30">
            {user?.email?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.email}</p>
            <p className="text-[10px] text-cyan-400 uppercase font-semibold">{user?.role}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all gap-2"
            title="Toggle color theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center justify-center p-2 bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl transition-all"
            title="Sign out of agent"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
