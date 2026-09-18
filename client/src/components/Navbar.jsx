import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const navItems = [
    { to: '/', label: 'Claims Feed', icon: '📋' },
    { to: '/submit', label: 'Submit Claim', icon: '➕' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <header className="h-16 bg-[#0F172A] text-slate-300 flex items-center justify-between px-6 border-b border-slate-800 shrink-0 sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          T
        </div>
        <h1 className="font-bold text-white text-lg tracking-tight leading-none">
          FactTriage
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
