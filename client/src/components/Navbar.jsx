import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const navItems = [
    {
      to: '/',
      label: 'Claims Feed',
      icon: (
        <svg className="w-3.5 h-3.5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      to: '/submit',
      label: 'Submit Claim',
      icon: (
        <svg className="w-3.5 h-3.5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: null
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] shrink-0">
      <div className="flex items-center justify-between px-6 sm:px-12 h-16 w-full">
        
        {/* Brand */}
        <div className="flex items-center cursor-pointer">
          <h1 className="font-black italic text-[28px] tracking-tighter leading-none flex items-start">
            <span className="text-black">FACT</span>
            <span className="text-[#FFD700] [text-shadow:2px_2px_0px_rgba(0,0,0,0.15)]">TRIAGE</span>
            <span className="text-[#FFD700] text-[10px] ml-0.5 mt-1 font-bold">®</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden sm:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 text-[11px] uppercase font-black tracking-[0.2em] px-4 py-2 rounded-lg border-2 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FFD700] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-gray-600 border-transparent hover:border-black hover:bg-slate-50 hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`
              }
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
