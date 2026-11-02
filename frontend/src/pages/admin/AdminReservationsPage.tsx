import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { getAllReservations, cancelReservation } from '../../services/api';
import type { Reservation } from '../../types';
import { Ticket, Search, ExternalLink, Filter } from 'lucide-react';

export const AdminReservationsPage: React.FC = () => {
  const { success, error } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel dialog
  const [cancellingPnr, setCancellingPnr] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllReservations();
      setReservations(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteCancel = async () => {
    if (!cancellingPnr) return;
    setIsCancelling(true);
    try {
      const res = await cancelReservation(cancellingPnr);
      success(`PNR ${cancellingPnr} cancelled! Refund: ₹${res.refundAmount}`);
      setCancellingPnr(null);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Database error during cancellation');
    } finally {
      setIsCancelling(false);
    }
  };

  const filtered = reservations.filter((r) => {
    const matchesSearch =
      r.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.reservationId).includes(searchTerm);
    const matchesStatus =
      statusFilter === 'ALL' || r.bookingStatus.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Reservation>[] = [
    {
      key: 'reservationId',
      header: 'Res ID',
      render: (r) => <span className="font-mono text-xs font-bold text-slate-700">#{r.reservationId}</span>,
    },
    {
      key: 'pnr',
      header: 'PNR Code',
      render: (r) => (
        <Link
          to={`/pnr?pnr=${r.pnr}`}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
        >
          {r.pnr} <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
    {
      key: 'passengerId',
      header: 'Passenger ID',
      render: (r) => (
        <Link
          to={`/dashboard`}
          className="text-xs font-mono font-semibold text-slate-700 hover:underline"
        >
          Passenger #{r.passengerId}
        </Link>
      ),
    },
    {
      key: 'scheduleId',
      header: 'Schedule ID',
      render: (r) => <span className="font-mono text-xs text-slate-600">Sch #{r.scheduleId}</span>,
    },
    {
      key: 'fareAmount',
      header: 'Fare Amount',
      render: (r) => <span className="font-mono font-bold text-slate-900">₹{r.fareAmount}</span>,
    },
    {
      key: 'bookingTimestamp',
      header: 'Booking Timestamp',
      render: (r) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.bookingTimestamp ? r.bookingTimestamp.replace('T', ' ') : '-'}
        </span>
      ),
    },
    {
      key: 'bookingStatus',
      header: 'Status',
      render: (r) => <Badge status={r.bookingStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Link to={`/pnr?pnr=${r.pnr}`}>
            <Button size="sm" variant="outline">
              Details
            </Button>
          </Link>
          {r.bookingStatus !== 'CANCELLED' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setCancellingPnr(r.pnr)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reservation Registry</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>RESERVATION</code>: Master ticket bookings, PNR audit logs, and lifecycle states
            </p>
          </div>
          <Link to="/book">
            <Button variant="primary" leftIcon={<Ticket className="w-4 h-4" />}>
              Book New Ticket
            </Button>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by PNR or Reservation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            keyField={(r) => r.reservationId}
            isLoading={loading}
            emptyMessage="No reservations match the filters."
          />
        </Card>

        {/* Cancel Confirm Dialog */}
        <ConfirmDialog
          isOpen={cancellingPnr !== null}
          title="Confirm Ticket Cancellation"
          message={`Are you sure you want to cancel reservation ${cancellingPnr}? This executes P_CANCEL_RESERVATION, records an automated refund in PAYMENT, and restores seat availability.`}
          confirmText="Execute Cancellation"
          confirmVariant="danger"
          isLoading={isCancelling}
          onConfirm={handleExecuteCancel}
          onClose={() => setCancellingPnr(null)}
        />
      </div>
    </AdminLayout>
  );
};
