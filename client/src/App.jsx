import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Leaf, LayoutDashboard, UploadCloud, ShieldAlert } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Login from './pages/Login'; // <-- Added import for Login

const App = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  // Check if we are on the login page
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* Premium Glassmorphic Navigation - Hidden on Login Page */}
      {!isLoginPage && (
        <nav className="glass sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between h-16 items-center">
              
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="p-2 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors duration-300">
                  <Leaf className="text-green-500 h-6 w-6" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                  Eco<span className="text-green-500">Reward</span>
                </span>
              </Link>

              <div className="hidden md:flex space-x-8 items-center">
                <Link to="/" className={`flex items-center space-x-2 text-sm font-medium transition-all duration-300 ${isActive('/') ? 'text-green-500 scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                
                <Link to="/upload" className={`flex items-center space-x-2 text-sm font-medium transition-all duration-300 ${isActive('/upload') ? 'text-green-500 scale-105' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  <UploadCloud size={18} />
                  <span>Upload</span>
                </Link>

                <Link to="/admin" className="pl-6 border-l border-gray-200 dark:border-gray-700 flex items-center space-x-2 text-sm text-gray-400 hover:text-red-500 transition-colors">
                  <ShieldAlert size={18} />
                  <span>Admin</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area - Removes max-width and padding if on Login page to allow full-screen layout */}
      <main className={`flex-grow w-full ${isLoginPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;