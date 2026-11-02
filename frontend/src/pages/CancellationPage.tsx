import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../context/ToastContext';
import { getReservationByPnr, cancelReservation } from '../services/api';
import type { ReservationDetails, CancellationResponse } from '../types';
import {
  XCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const CancellationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';
  const { success, error } = useToast();

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [details, setDetails] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [cancelResult, setCancelResult] = useState<CancellationResponse | null>(null);

  const fetchPnr = async (pnrToQuery: string) => {
    if (!pnrToQuery.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setCancelResult(null);
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

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (pnrInput.trim()) {
      setSearchParams({ pnr: pnrInput.trim().toUpperCase() });
      fetchPnr(pnrInput.trim().toUpperCase());
    }
  };

  const handleExecuteCancel = async () => {
    if (!details) return;
    setCancelling(true);
    try {
      const res = await cancelReservation(details.pnr);
      setCancelResult(res);
      setConfirmOpen(false);
      success('Reservation cancelled successfully!');
      // Refresh details
      const updated = await getReservationByPnr(details.pnr);
      setDetails(updated);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Database error during cancellation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cancel Reservation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute stored procedure <code>P_CANCEL_RESERVATION</code> with automatic seat release and refund calculation
          </p>
        </div>

        {/* Lookup form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter PNR to cancel..."
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base uppercase font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              maxLength={12}
              required
            />
            <Button
              type="submit"
              variant="danger"
              size="md"
              leftIcon={<Search className="w-4 h-4" />}
              isLoading={loading}
            >
              Lookup Booking
            </Button>
          </form>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner size="lg" message="Retrieving booking records..." />}

        {/* Error */}
        {!loading && errorMessage && (
          <ErrorState
            title="Unable to Locate PNR"
            message={errorMessage}
            onRetry={() => pnrInput && fetchPnr(pnrInput)}
          />
        )}

        {/* Cancellation outcome alert */}
        {cancelResult && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  {cancelResult.result}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-rose-700">
                  <p>
                    Refund Amount: <span className="font-bold font-mono">₹{cancelResult.refundAmount}</span>
                  </p>
                  <p>
                    Refund Txn Ref: <span className="font-mono">{cancelResult.transactionReference}</span>
                  </p>
                  <p>
                    Status Updated To: <Badge status={cancelResult.bookingStatus} size="sm" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details Card */}
        {!loading && details && (
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-base font-bold">PNR: {details.pnr}</span>
                <Badge status={details.bookingStatus} />
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block">Passenger:</span>
                  <span className="text-sm font-semibold text-slate-800">{details.passengerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <span className="text-sm font-semibold text-slate-800">{details.passengerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Train:</span>
                  <span className="font-medium text-slate-800">
                    {details.trainName} (#{details.trainNumber})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Route:</span>
                  <span className="font-medium text-slate-800">
                    {details.sourceStationName} → {details.destinationStationName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Journey Date:</span>
                  <span className="font-medium text-slate-800">{details.journeyDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Seat / Berth:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {details.coachNumber} #{details.seatNumber} ({details.coachClass} - {details.berthType})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fare Paid:</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    ₹{details.fareAmount}
                  </span>
                </div>
              </div>

              {details.bookingStatus === 'CANCELLED' ? (
                <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-500">
                  This reservation has already been cancelled. No further action can be taken.
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Cancelling will release seat #{details.seatNumber} back into inventory.
                  </span>
                  <Button
                    variant="danger"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmOpen}
          title="Cancel Reservation?"
          message={`Are you sure you want to cancel reservation for PNR ${details?.pnr}? This will invoke PL/SQL procedure P_CANCEL_RESERVATION and issue a refund.`}
          confirmText="Yes, Cancel Booking"
          confirmVariant="danger"
          isLoading={cancelling}
          onConfirm={handleExecuteCancel}
          onClose={() => setConfirmOpen(false)}
        />
      </div>
    </PageLayout>
  );
};
