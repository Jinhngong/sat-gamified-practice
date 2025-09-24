import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const Header = ({ user, userProgress }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/auth');
    }
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/practice', label: 'Practice', icon: '📚' },
    { path: '/exam', label: 'Exam', icon: '⏰' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PracticeSAT
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {userProgress && (
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Points:</span>
                  <span className="font-semibold text-blue-600">{userProgress.points || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Streak:</span>
                  <span className="font-semibold text-green-600">{userProgress.streak || 0}</span>
                </div>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  </div>
                  
                  {/* Mobile Navigation */}
                  <div className="md:hidden border-b border-gray-100">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                          isActive(item.path) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <span>🚪</span>
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden" 
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
