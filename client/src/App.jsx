import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import PublicFeed from './pages/PublicFeed';
import SubmitClaim from './pages/SubmitClaim';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">

        {/* Dark Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<PublicFeed />} />
            <Route path="/submit"    element={<SubmitClaim />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      </div>
    </AuthProvider>
  );
}