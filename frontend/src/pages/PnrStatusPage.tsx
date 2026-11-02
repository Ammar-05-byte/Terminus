import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { getReservationByPnr, recordPayment } from '../services/api';
import type { ReservationDetails, Payment } from '../types';
import {
  FileCheck2,
  Search,
  Train,
  User,
  Armchair,
  CreditCard,
  XCircle,
} from 'lucide-react';

export const PnrStatusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';
  const { success, error } = useToast();

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [details, setDetails] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retry payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('SUCCESS');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchPnr = async (pnrToQuery: string) => {
    if (!pnrToQuery.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getReservationByPnr(pnrToQuery.trim().toUpperCase());
      setDetails(data);
    } catch (err: any) {
      console.error(err);
      setDetails(null);
      setErrorMessage(
        err?.response?.data?.message || 'No reservation found for PNR ' + pnrToQuery
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPnr) {
      fetchPnr(initialPnr);
    }
  }, [initialPnr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pnrInput.trim()) {
      setSearchParams({ pnr: pnrInput.trim().toUpperCase() });
      fetchPnr(pnrInput.trim().toUpperCase());
    }
  };

  const handleRetryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details) return;
    setPaymentLoading(true);
    try {
      await recordPayment(details.pnr, {
        amount: details.fareAmount,
        paymentMethod,
        paymentStatus,
      });
      success(`Payment processed! Status: ${paymentStatus}`);
      setPaymentModalOpen(false);
      // Refresh reservation details
      fetchPnr(details.pnr);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'paymentId',
      header: 'Pay ID',
      render: (p) => <span className="font-mono text-xs">#{p.paymentId}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => <span className="font-bold text-slate-800">₹{p.amount}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (p) => <span className="text-xs uppercase">{p.paymentMethod}</span>,
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (p) => <Badge status={p.paymentStatus} size="sm" />,
    },
    {
      key: 'transactionReference',
      header: 'Txn Reference',
      render: (p) => (
        <span className="font-mono text-xs text-slate-500">
          {p.transactionReference || '-'}
        </span>
      ),
    },
    {
      key: 'paymentTimestamp',
      header: 'Timestamp',
      render: (p) => (
        <span className="text-xs text-slate-500">
          {p.paymentTimestamp ? p.paymentTimestamp.replace('T', ' ') : '-'}
        </span>
      ),
    },
  ];

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PNR Status Inquiry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status lookup querying database view <code>V_RESERVATION_DETAILS</code>
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter 10-character PNR (e.g., PNR20261101)..."
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base uppercase font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                maxLength={12}
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={<Search className="w-5 h-5" />}
              isLoading={loading}
            >
              Get Status
            </Button>
          </form>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner size="lg" message="Fetching PNR status from database..." />}

        {/* Error */}
        {!loading && errorMessage && (
          <ErrorState
            title="PNR Inquiry Notice"
            message={errorMessage}
            onRetry={() => pnrInput && fetchPnr(pnrInput)}
          />
        )}

        {/* Empty when no search performed yet */}
        {!loading && !errorMessage && !details && (
          <EmptyState
            icon={<FileCheck2 className="w-10 h-10 text-slate-400" />}
            title="Search for a PNR"
            message="Enter a valid 10-character PNR in the box above to inspect passenger information, train route, seat allocation, and payment history."
          />
        )}

        {/* Result Card */}
        {!loading && details && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-blue-200 font-semibold block">
                  Passenger Name Record
                </span>
                <span className="text-3xl font-extrabold font-mono tracking-wider block mt-1">
                  {details.pnr}
                </span>
                <p className="text-xs text-blue-100 mt-1">
                  Booked on {details.bookingTimestamp?.replace('T', ' ')} • Res ID #{details.reservationId}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <Badge status={details.bookingStatus} size="md" />
                <span className="text-2xl font-bold font-mono">
                  ₹{details.fareAmount}
                </span>
              </div>
            </div>

            {/* Grid of info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Passenger Info */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Passenger Details</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Full Name:</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {details.passengerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Phone:</span>
                    <span className="text-slate-700">{details.passengerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email:</span>
                    <span className="text-slate-700">{details.passengerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender & DOB:</span>
                    <span className="text-slate-700">
                      {details.passengerGender} • {details.passengerDob}
                    </span>
                  </div>
                </div>
              </div>

              {/* Journey Info */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-sm">
                  <Train className="w-4 h-4 text-blue-600" />
                  <span>Train & Journey</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Train:</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {details.trainName} (#{details.trainNumber})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Route:</span>
                    <span className="text-slate-700 font-medium">
                      {details.sourceStationName} ({details.sourceStationCode}) →{' '}
                      {details.destinationStationName} ({details.destinationStationCode})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Journey Date:</span>
                    <span className="text-slate-700 font-medium">{details.journeyDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Departure:</span>
                    <span className="text-slate-700 font-mono">
                      {details.scheduledDeparture?.replace('T', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seat Info */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-sm">
                  <Armchair className="w-4 h-4 text-blue-600" />
                  <span>Seat Allocation</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Coach & Seat:</span>
                    <span className="font-bold text-slate-900 text-base font-mono">
                      {details.coachNumber} / Seat #{details.seatNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Coach Class:</span>
                    <Badge variant="blue" size="sm">{details.coachClass}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Berth Type:</span>
                    <span className="text-slate-700 font-semibold uppercase">
                      {details.berthType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History Table */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Payment Audit History</span>
                </div>
              }
              subtitle="All payment attempts and ledger records linked to this PNR"
              actions={
                details.bookingStatus === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setPaymentModalOpen(true)}
                  >
                    Retry / Record Payment
                  </Button>
                )
              }
            >
              <DataTable
                columns={paymentColumns}
                data={details.payments || []}
                keyField={(p) => p.paymentId}
                emptyMessage="No payments recorded for this reservation yet."
              />
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <Link to="/search">
                <Button variant="outline">Search Other Trains</Button>
              </Link>
              {details.bookingStatus !== 'CANCELLED' && (
                <Link to={`/cancel?pnr=${details.pnr}`}>
                  <Button
                    variant="danger"
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Cancel This Reservation
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Retry Payment Modal */}
        {details && (
          <Modal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            title={`Record Payment for ${details.pnr}`}
          >
            <form onSubmit={handleRetryPayment} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500">Amount Due</span>
                <p className="text-2xl font-bold font-mono text-slate-900">
                  ₹{details.fareAmount}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Simulated Outcome
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="SUCCESS">SUCCESS (Triggers reservation confirmation)</option>
                  <option value="FAILED">FAILED (Keep pending)</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={paymentLoading}>
                  Submit Payment
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </PageLayout>
  );
};
