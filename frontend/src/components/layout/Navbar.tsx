import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Train,
  Search,
  FileCheck2,
  Ticket,
  User,
  Shield,
  Menu,
  X,
  XCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/', icon: <Train className="w-4 h-4" /> },
    { label: 'Search Trains', path: '/search', icon: <Search className="w-4 h-4" /> },
    { label: 'Book Ticket', path: '/book', icon: <Ticket className="w-4 h-4" /> },
    { label: 'PNR Status', path: '/pnr', icon: <FileCheck2 className="w-4 h-4" /> },
    { label: 'Cancel Ticket', path: '/cancel', icon: <XCircle className="w-4 h-4" /> },
    { label: 'Passenger Hub', path: '/dashboard', icon: <User className="w-4 h-4" /> },
    { label: 'Admin Portal', path: '/admin', icon: <Shield className="w-4 h-4" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-[#1e3a5f] text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-500 transition-colors">
              <span className="text-xl">🚂</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight">
                Terminus
              </span>
              <span className="text-[10px] text-blue-200 tracking-wider uppercase font-semibold block">
                Railway DBMS
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#152843] border-t border-white/10 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
