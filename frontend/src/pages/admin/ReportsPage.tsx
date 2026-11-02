import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DataTable, Column } from '../../components/common/DataTable';
import {
  getRevenue,
  getOccupancy,
  getMonthlyBookings,
  getPopularRoutes,
} from '../../services/api';
import type {
  RevenueReport,
  OccupancyReport,
  MonthlyBookingReport,
  PopularRouteReport,
} from '../../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Percent,
  Calendar,
  Route,
  IndianRupee,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'occupancy' | 'monthly' | 'routes'>('revenue');
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [revenueData, setRevenueData] = useState<RevenueReport[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyBookingReport[]>([]);
  const [popularRoutesData, setPopularRoutesData] = useState<PopularRouteReport[]>([]);

  useEffect(() => {
    const fetchAllReports = async () => {
      setLoading(true);
      try {
        const [rev, occ, mon, pop] = await Promise.all([
          getRevenue(),
          getOccupancy(),
          getMonthlyBookings(),
          getPopularRoutes(),
        ]);
        setRevenueData(rev);
        setOccupancyData(occ);
        setMonthlyData(mon);
        setPopularRoutesData(pop);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReports();
  }, []);

  // Columns for Revenue
  const revenueColumns: Column<RevenueReport>[] = [
    {
      key: 'trainNumber',
      header: 'Train #',
      render: (r) => <span className="font-mono font-bold text-blue-600">#{r.trainNumber}</span>,
    },
    {
      key: 'trainName',
      header: 'Train Name',
      render: (r) => <span className="font-semibold text-slate-900">{r.trainName}</span>,
    },
    {
      key: 'totalBookings',
      header: 'Total Bookings',
      render: (r) => <span className="font-bold text-slate-800">{r.totalBookings}</span>,
    },
    {
      key: 'grossRevenue',
      header: 'Gross Revenue',
      render: (r) => <span className="font-mono text-emerald-600 font-bold">₹{r.grossRevenue}</span>,
    },
    {
      key: 'totalRefunds',
      header: 'Refunds',
      render: (r) => <span className="font-mono text-rose-600 font-bold">₹{r.totalRefunds}</span>,
    },
    {
      key: 'netRevenue',
      header: 'Net Revenue',
      render: (r) => <span className="font-mono text-blue-700 font-bold">₹{r.netRevenue}</span>,
    },
  ];

  // Columns for Occupancy
  const occupancyColumns: Column<OccupancyReport>[] = [
    {
      key: 'trainNumber',
      header: 'Train #',
      render: (r) => <span className="font-mono font-bold text-blue-600">#{r.trainNumber}</span>,
    },
    {
      key: 'trainName',
      header: 'Train Name',
      render: (r) => <span className="font-medium text-slate-800">{r.trainName}</span>,
    },
    {
      key: 'journeyDate',
      header: 'Journey Date',
      render: (r) => <span className="font-mono text-xs text-slate-600">{r.journeyDate}</span>,
    },
    {
      key: 'coachClass',
      header: 'Coach Class',
      render: (r) => <span className="font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">{r.coachClass}</span>,
    },
    {
      key: 'totalSeats',
      header: 'Total Seats',
      render: (r) => <span className="font-mono">{r.totalSeats}</span>,
    },
    {
      key: 'bookedSeats',
      header: 'Booked',
      render: (r) => <span className="font-mono font-bold text-rose-600">{r.bookedSeats}</span>,
    },
    {
      key: 'availableSeats',
      header: 'Available',
      render: (r) => <span className="font-mono font-bold text-emerald-600">{r.availableSeats}</span>,
    },
    {
      key: 'occupancyPercentage',
      header: 'Occupancy %',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                r.occupancyPercentage > 80
                  ? 'bg-rose-500'
                  : r.occupancyPercentage > 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(r.occupancyPercentage, 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-slate-800">
            {r.occupancyPercentage}%
          </span>
        </div>
      ),
    },
  ];

  // Columns for Monthly
  const monthlyColumns: Column<MonthlyBookingReport>[] = [
    {
      key: 'bookingMonth',
      header: 'Month',
      render: (r) => <span className="font-bold text-slate-800">{r.bookingMonth} {r.year}</span>,
    },
    {
      key: 'totalBookings',
      header: 'Total Bookings',
      render: (r) => <span className="font-bold">{r.totalBookings}</span>,
    },
    {
      key: 'confirmedBookings',
      header: 'Confirmed',
      render: (r) => <span className="font-bold text-emerald-600">{r.confirmedBookings}</span>,
    },
    {
      key: 'cancelledBookings',
      header: 'Cancelled',
      render: (r) => <span className="font-bold text-rose-600">{r.cancelledBookings}</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Monthly Revenue',
      render: (r) => <span className="font-mono font-bold text-blue-700">₹{r.totalRevenue}</span>,
    },
  ];

  // Columns for Popular Routes
  const popularRouteColumns: Column<PopularRouteReport>[] = [
    {
      key: 'route',
      header: 'Travel Route',
      render: (r) => (
        <span className="font-bold text-slate-900">
          {r.sourceStationName} ({r.sourceStationCode}) → {r.destinationStationName} ({r.destinationStationCode})
        </span>
      ),
    },
    {
      key: 'totalTrips',
      header: 'Total Trips',
      render: (r) => <span className="font-mono font-semibold">{r.totalTrips}</span>,
    },
    {
      key: 'totalPassengers',
      header: 'Total Passengers',
      render: (r) => <span className="font-mono font-bold text-slate-800">{r.totalPassengers}</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Route Revenue',
      render: (r) => <span className="font-mono font-bold text-emerald-600">₹{r.totalRevenue}</span>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Financial Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated analytical reporting executing queries Q08, Q09, Q10, and Q14
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'revenue', label: 'Financial Revenue (Q09)', icon: <IndianRupee className="w-4 h-4" /> },
            { id: 'occupancy', label: 'Coach Occupancy (Q08)', icon: <Percent className="w-4 h-4" /> },
            { id: 'monthly', label: 'Monthly Trends (Q14)', icon: <Calendar className="w-4 h-4" /> },
            { id: 'routes', label: 'Popular Routes (Q10)', icon: <Route className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner size="lg" message="Compiling analytical reports..." />
        ) : (
          <div className="space-y-6">
            {/* TAB 1: REVENUE */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <Card
                  title="Revenue by Train Comparison"
                  subtitle="Gross revenue vs Net operating revenue across active fleet"
                >
                  <div className="h-80 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="trainName" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: any) => [`₹${value}`, '']}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <Legend />
                        <Bar dataKey="grossRevenue" fill="#2563eb" name="Gross Revenue (₹)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="netRevenue" fill="#10b981" name="Net Revenue (₹)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="totalRefunds" fill="#ef4444" name="Refunds (₹)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card
                  title="Train Financial Breakdown"
                  subtitle="Query Q09: Total bookings, gross receipts, and refund adjustments"
                >
                  <DataTable
                    columns={revenueColumns}
                    data={revenueData}
                    keyField={(r) => r.trainId}
                    emptyMessage="No revenue data available."
                  />
                </Card>
              </div>
            )}

            {/* TAB 2: OCCUPANCY */}
            {activeTab === 'occupancy' && (
              <div className="space-y-6">
                <Card
                  title="Coach Occupancy Analysis"
                  subtitle="Query Q08: Class-level seat utilization and percentage load factor"
                >
                  <DataTable
                    columns={occupancyColumns}
                    data={occupancyData}
                    keyField={(r, idx) => `${r.trainId}-${r.coachClass}-${idx}`}
                    emptyMessage="No occupancy records found."
                  />
                </Card>
              </div>
            )}

            {/* TAB 3: MONTHLY TRENDS */}
            {activeTab === 'monthly' && (
              <div className="space-y-6">
                <Card
                  title="Monthly Booking Velocity"
                  subtitle="Query Q14: Total, confirmed, and cancelled booking counts over time"
                >
                  <div className="h-80 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="bookingMonth" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalBookings"
                          stroke="#2563eb"
                          strokeWidth={2}
                          name="Total Bookings"
                        />
                        <Line
                          type="monotone"
                          dataKey="confirmedBookings"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Confirmed"
                        />
                        <Line
                          type="monotone"
                          dataKey="cancelledBookings"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Cancelled"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card
                  title="Monthly Aggregates Ledger"
                  subtitle="Revenue and ticket volumes by calendar month"
                >
                  <DataTable
                    columns={monthlyColumns}
                    data={monthlyData}
                    keyField={(m) => `${m.year}-${m.bookingMonth}`}
                    emptyMessage="No monthly statistics compiled."
                  />
                </Card>
              </div>
            )}

            {/* TAB 4: POPULAR ROUTES */}
            {activeTab === 'routes' && (
              <div className="space-y-6">
                <Card
                  title="Top Popular Travel Routes"
                  subtitle="Query Q10: Station pair traffic demand and passenger density"
                >
                  <DataTable
                    columns={popularRouteColumns}
                    data={popularRoutesData}
                    keyField={(r, idx) => `${r.sourceStationId}-${r.destinationStationId}-${idx}`}
                    emptyMessage="No route statistics found."
                  />
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
