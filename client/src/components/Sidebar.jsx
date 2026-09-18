import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Claims Feed', icon: '📋' },
    { to: '/submit', label: 'Submit Claim', icon: '➕' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0F172A] text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 sticky top-0">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            T
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">
              FactTriage
            </h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Civic Tech Platform
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* Footer message instead of login */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-[11px] text-center text-slate-500">
          Community-driven fact verification
        </p>
      </div>
    </aside>
  );
}