import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Train,
  Route,
  CalendarDays,
  Armchair,
  Ticket,
  CreditCard,
  BarChart3,
  Database,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
    { label: 'Database Lab', path: '/admin/database-lab', icon: <Database className="w-4 h-4" /> },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Passengers', path: '/admin/passengers', icon: <Users className="w-4 h-4" /> },
    { label: 'Stations', path: '/admin/stations', icon: <MapPin className="w-4 h-4" /> },
    { label: 'Trains', path: '/admin/trains', icon: <Train className="w-4 h-4" /> },
    { label: 'Routes & Stops', path: '/admin/routes', icon: <Route className="w-4 h-4" /> },
    { label: 'Schedules', path: '/admin/schedules', icon: <CalendarDays className="w-4 h-4" /> },
    { label: 'Seats', path: '/admin/seats', icon: <Armchair className="w-4 h-4" /> },
    { label: 'Reservations', path: '/admin/reservations', icon: <Ticket className="w-4 h-4" /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (location.pathname.startsWith(path) && path !== '/admin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3 sticky top-20">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Admin Management
            </div>
            <nav className="space-y-1 mt-1">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Switch to User / Passenger Portal */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Passenger Portal
              </div>
              <Link
                to="/"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span>← Back to Public Site</span>
                <span>🚂</span>
              </Link>
              <div className="grid grid-cols-2 gap-1 mt-1.5">
                <Link
                  to="/search"
                  className="px-2 py-1.5 rounded-md text-xs text-center text-slate-600 bg-slate-50 hover:bg-slate-100 font-medium"
                >
                  Search Trains
                </Link>
                <Link
                  to="/book"
                  className="px-2 py-1.5 rounded-md text-xs text-center text-slate-600 bg-slate-50 hover:bg-slate-100 font-medium"
                >
                  Book Ticket
                </Link>
                <Link
                  to="/pnr"
                  className="px-2 py-1.5 rounded-md text-xs text-center text-slate-600 bg-slate-50 hover:bg-slate-100 font-medium"
                >
                  PNR Status
                </Link>
                <Link
                  to="/cancel"
                  className="px-2 py-1.5 rounded-md text-xs text-center text-rose-600 bg-rose-50 hover:bg-rose-100 font-medium"
                >
                  Cancel Ticket
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
