import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DataTable, Column } from '../components/common/DataTable';
import { getPaymentHistory } from '../services/api';
import type { Payment } from '../types';
import { CreditCard, Search, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

export const PaymentHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  const fetchPayments = async (pnrToQuery: string) => {
    if (!pnrToQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await getPaymentHistory(pnrToQuery.trim().toUpperCase());
      setPayments(data);
    } catch (err: any) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPnr) {
      fetchPayments(initialPnr);
    }
  }, [initialPnr]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pnrInput.trim()) {
      setSearchParams({ pnr: pnrInput.trim().toUpperCase() });
      fetchPayments(pnrInput.trim().toUpperCase());
    }
  };

  // Calculations
  const totalPaid = payments
    .filter((p) => p.paymentStatus === 'SUCCESS')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalRefunded = payments
    .filter((p) => p.paymentStatus === 'REFUND_SUCCESS' || p.paymentStatus === 'REFUNDED')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const netAmount = totalPaid - totalRefunded;

  const columns: Column<Payment>[] = [
    {
      key: 'paymentId',
      header: 'Txn ID',
      render: (p) => <span className="font-mono text-xs">#{p.paymentId}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => (
        <span
          className={`font-mono font-bold ${
            p.paymentStatus === 'REFUND_SUCCESS' || p.paymentStatus === 'REFUNDED'
              ? 'text-blue-600'
              : p.paymentStatus === 'SUCCESS'
              ? 'text-emerald-600'
              : 'text-slate-800'
          }`}
        >
          ₹{p.amount}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (p) => (
        <span className="text-xs uppercase font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
          {p.paymentMethod}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (p) => <Badge status={p.paymentStatus} size="sm" />,
    },
    {
      key: 'transactionReference',
      header: 'Txn Ref',
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
          <h1 className="text-2xl font-bold text-slate-900">Payment Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Query financial transactions linked to reservations in table <code>PAYMENT</code>
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter PNR for payment history (e.g. PNR1000000001)..."
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base uppercase font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              maxLength={20}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Search className="w-4 h-4" />}
              isLoading={loading}
            >
              Lookup Payments
            </Button>
          </form>
        </div>

        {loading && <LoadingSpinner size="lg" message="Querying ledger records..." />}

        {!loading && searched && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 uppercase">
                    Total Paid
                  </span>
                  <p className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">
                    ₹{totalPaid}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-700 uppercase">
                    Total Refunded
                  </span>
                  <p className="text-2xl font-bold font-mono text-blue-900 mt-0.5">
                    ₹{totalRefunded}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 uppercase">
                    Net Amount
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                    ₹{netAmount}
                  </p>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Table Card */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Payment Ledger for PNR {pnrInput.toUpperCase()}</span>
                </div>
              }
              subtitle={`${payments.length} transaction record(s) on file`}
            >
              <DataTable
                columns={columns}
                data={payments}
                keyField={(p) => p.paymentId}
                emptyMessage="No payments found for this PNR."
              />
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
