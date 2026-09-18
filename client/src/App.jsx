import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PublicFeed from './pages/PublicFeed';
import SubmitClaim from './pages/SubmitClaim';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"          element={<PublicFeed />} />
          <Route path="/submit"    element={<SubmitClaim />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </div>
  );
}