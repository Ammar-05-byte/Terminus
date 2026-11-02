import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { SearchForm } from '../components/search/SearchForm';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { getDashboard } from '../services/api';
import type { DashboardStats } from '../types';
import {
  Train,
  MapPin,
  Ticket,
  Users,
  Search,
  FileCheck,
  XCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [pnrInput, setPnrInput] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      }
    };
    fetchStats();
  }, []);

  const handlePnrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pnrInput.trim()) {
      navigate(`/pnr?pnr=${pnrInput.trim().toUpperCase()}`);
    }
  };

  const featureCards = [
    {
      title: 'Search Trains',
      desc: 'Look up live train schedules, arrival/departure timings, and seat availability.',
      icon: <Search className="w-6 h-6 text-blue-600" />,
      link: '/search',
      btnText: 'Search Trains',
    },
    {
      title: 'Book Tickets',
      desc: 'Seamless multi-step ticket reservation with coach selection & instant confirmation.',
      icon: <Ticket className="w-6 h-6 text-emerald-600" />,
      link: '/book',
      btnText: 'Book Now',
    },
    {
      title: 'PNR Status Inquiry',
      desc: 'Track your booking status, coach allocation, berth assignment, and payment details.',
      icon: <FileCheck className="w-6 h-6 text-amber-600" />,
      link: '/pnr',
      btnText: 'Check Status',
    },
    {
      title: 'Ticket Cancellation',
      desc: 'Instant cancellations with automated refund calculation via database procedures.',
      icon: <XCircle className="w-6 h-6 text-rose-600" />,
      link: '/cancel',
      btnText: 'Cancel Ticket',
    },
  ];

  return (
    <PageLayout showContainer={false}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#1d4ed8] to-[#2563eb] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background circuit/rail lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-blue-100 mb-4 border border-white/20">
            <span>🚂</span> Academic DBMS Demonstration Project
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            India's Railway Reservation System
          </h1>
          <p className="mt-4 text-base sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Engineered with ACID transaction compliance, PL/SQL stored procedures, triggers, and real-time seat inventory management.
          </p>
        </div>
      </div>

      {/* Floating Search Section */}
      <div className="max-w-5xl mx-auto px-4 -mt-14 relative z-20">
        <SearchForm />
      </div>

      {/* PNR Quick Lookup Banner */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Have a Ticket? Check PNR Status</h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Enter your PNR (e.g. PNR1000000001) to check real-time reservation status and coach berth.
              </p>
            </div>
          </div>
          <form onSubmit={handlePnrSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="e.g. PNR1000000001"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-300 w-full md:w-56"
              maxLength={20}
              required
            />
            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap"
            >
              Check PNR
            </Button>
          </form>
        </div>
      </div>

      {/* System Stats from Dashboard */}
      <div className="max-w-5xl mx-auto px-4 mt-12">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Live Network Statistics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time aggregate data queried from the database
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Trains"
            value={stats ? stats.totalTrains : '--'}
            icon={<Train className="w-5 h-5" />}
            color="blue"
            subtext="Active fleet"
          />
          <StatCard
            label="Railway Stations"
            value={stats ? stats.totalStations : '--'}
            icon={<MapPin className="w-5 h-5" />}
            color="indigo"
            subtext="Connected nodes"
          />
          <StatCard
            label="Passengers"
            value={stats ? stats.totalPassengers : '--'}
            icon={<Users className="w-5 h-5" />}
            color="purple"
            subtext="Registered travelers"
          />
          <StatCard
            label="Total Bookings"
            value={stats ? stats.totalReservations : '--'}
            icon={<Ticket className="w-5 h-5" />}
            color="emerald"
            subtext={`${stats ? stats.confirmedCount : 0} confirmed`}
          />
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="max-w-5xl mx-auto px-4 mt-14 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Explore Services</h2>
          <p className="text-sm text-slate-500 mt-1">
            High-speed railway operations designed for university demonstration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feat) => (
            <div
              key={feat.title}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-slate-50 rounded-xl inline-block mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-slate-800">{feat.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{feat.desc}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link to={feat.link}>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span>{feat.btnText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Database Lab Quick Callout */}
        <div className="mt-10 bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Interactive Database Operations Lab</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Professor Demo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Test stored procedures (<code>P_BOOK_TICKET</code>, <code>P_CANCEL_RESERVATION</code>, <code>P_EXPIRE_STALE_RESERVATIONS</code>), trigger side-effects, and execute predefined queries Q01-Q15.
              </p>
            </div>
          </div>
          <Link to="/admin/database-lab" className="flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Database Lab
            </Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};
