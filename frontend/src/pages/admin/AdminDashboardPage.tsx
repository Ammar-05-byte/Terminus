import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getDashboard } from '../../services/api';
import type { DashboardStats } from '../../types';
import {
  Users,
  Train,
  MapPin,
  Ticket,
  IndianRupee,
  Database,
  BarChart3,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" message="Loading administrative metrics..." />
      </AdminLayout>
    );
  }

  const netRev = stats
    ? Number(stats.totalRevenue || 0) - Number(stats.totalRefunds || 0)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
            <p className="text-xs text-slate-500 mt-1">
              System health, ACID transaction diagnostics, and railway fleet management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/database-lab">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Database className="w-4 h-4" />}
              >
                Database Lab
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button
                variant="outline"
                size="md"
                leftIcon={<BarChart3 className="w-4 h-4" />}
              >
                Analytics & Charts
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-emerald-100 tracking-wider">
                Gross System Revenue
              </span>
              <IndianRupee className="w-5 h-5 text-emerald-200" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2">
              ₹{stats ? stats.totalRevenue : 0}
            </p>
            <p className="text-xs text-emerald-100 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Computed from confirmed transactions
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-rose-100 tracking-wider">
                Total Refund Outflow
              </span>
              <AlertCircle className="w-5 h-5 text-rose-200" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2">
              ₹{stats ? stats.totalRefunds : 0}
            </p>
            <p className="text-xs text-rose-100 mt-2">
              Automated refunds processed via cancellations
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-blue-100 tracking-wider">
                Net Operating Revenue
              </span>
              <CheckCircle2 className="w-5 h-5 text-blue-200" />
            </div>
            <p className="text-3xl font-extrabold font-mono mt-2">
              ₹{netRev}
            </p>
            <p className="text-xs text-blue-100 mt-2">
              Gross Revenue minus Processed Refunds
            </p>
          </div>
        </div>

        {/* Entity Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Passengers"
            value={stats ? stats.totalPassengers : 0}
            icon={<Users className="w-5 h-5" />}
            color="purple"
            subtext="Table PASSENGER"
          />
          <StatCard
            label="Trains Active"
            value={stats ? stats.totalTrains : 0}
            icon={<Train className="w-5 h-5" />}
            color="blue"
            subtext="Table TRAIN"
          />
          <StatCard
            label="Railway Stations"
            value={stats ? stats.totalStations : 0}
            icon={<MapPin className="w-5 h-5" />}
            color="indigo"
            subtext="Table STATION"
          />
          <StatCard
            label="Reservations"
            value={stats ? stats.totalReservations : 0}
            icon={<Ticket className="w-5 h-5" />}
            color="emerald"
            subtext={`${stats ? stats.confirmedCount : 0} confirmed`}
          />
        </div>

        {/* Quick Action Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Database Entities & Tables"
            subtitle="Manage relational schema tables with full CRUD capabilities"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Passengers', path: '/admin/passengers' },
                { label: 'Stations', path: '/admin/stations' },
                { label: 'Trains Fleet', path: '/admin/trains' },
                { label: 'Routes & Stops', path: '/admin/routes' },
                { label: 'Schedules', path: '/admin/schedules' },
                { label: 'Seats Inventory', path: '/admin/seats' },
                { label: 'Reservations', path: '/admin/reservations' },
                { label: 'Payments Ledger', path: '/admin/payments' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between text-xs font-semibold text-slate-800"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </Card>

          <Card
            title="DBMS Lab Operations"
            subtitle="Demonstrate stored procedures, triggers, and analytical queries"
          >
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <span className="font-bold block mb-0.5">Stored Procedures & Triggers:</span>
                Execute <code>P_BOOK_TICKET</code>, <code>P_CANCEL_RESERVATION</code>, <code>P_EXPIRE_STALE_RESERVATIONS</code>, and observe reactive trigger execution.
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <span className="font-bold block mb-0.5">Academic Queries (Q01 - Q15):</span>
                Run complex multi-table JOINs, subqueries, group aggregations, and window-like rollups.
              </div>

              <div className="pt-2">
                <Link to="/admin/database-lab">
                  <Button variant="primary" size="md" className="w-full">
                    Open Database Lab Console
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
