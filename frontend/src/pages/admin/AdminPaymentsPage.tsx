import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { getAllPayments } from '../../services/api';
import type { Payment } from '../../types';
import { Search, Filter } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.transactionReference &&
        p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(p.paymentId).includes(searchTerm) ||
      String(p.reservationId).includes(searchTerm);
    const matchesStatus =
      statusFilter === 'ALL' || p.paymentStatus.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Payment>[] = [
    {
      key: 'paymentId',
      header: 'Pay ID',
      render: (p) => <span className="font-mono text-xs font-bold text-slate-700">#{p.paymentId}</span>,
    },
    {
      key: 'reservationId',
      header: 'Reservation ID',
      render: (p) => (
        <span className="font-mono text-xs text-blue-600 font-bold">
          Res #{p.reservationId}
        </span>
      ),
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
        <span className="text-xs text-slate-500 font-mono">
          {p.paymentTimestamp ? p.paymentTimestamp.replace('T', ' ') : '-'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Audit Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Table <code>PAYMENT</code>: All recorded credit, debit, refund, and UPI gateway transactions
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Txn Reference, Reservation ID, or Payment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUND_SUCCESS'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            keyField={(p) => p.paymentId}
            isLoading={loading}
            emptyMessage="No payment transactions found matching criteria."
          />
        </Card>
      </div>
    </AdminLayout>
  );
};
