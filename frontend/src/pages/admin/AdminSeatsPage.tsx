import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { useToast } from '../../context/ToastContext';
import {
  getSeats,
  getTrains,
  createSeat,
  updateSeat,
  deleteSeat,
} from '../../services/api';
import type { Seat, Train, SeatRequest } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const AdminSeatsPage: React.FC = () => {
  const { success, error } = useToast();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrainFilter, setSelectedTrainFilter] = useState<number | 'ALL'>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<SeatRequest>({
    trainId: 0,
    coachNumber: 'S1',
    seatNumber: 1,
    coachClass: 'SL',
    berthType: 'LOWER',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seatList, trainList] = await Promise.all([getSeats(), getTrains()]);
      setSeats(seatList);
      setTrains(trainList);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch seats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSeat(null);
    setFormData({
      trainId: trains.length > 0 ? trains[0].trainId : 0,
      coachNumber: 'S1',
      seatNumber: 1,
      coachClass: 'SL',
      berthType: 'LOWER',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Seat) => {
    setEditingSeat(s);
    setFormData({
      trainId: s.trainId,
      coachNumber: s.coachNumber,
      seatNumber: s.seatNumber,
      coachClass: s.coachClass,
      berthType: s.berthType,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingSeat) {
        await updateSeat(editingSeat.seatId, formData);
        success('Seat updated successfully');
      } else {
        await createSeat(formData);
        success('Seat added successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save seat');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteSeat(deletingId);
      success('Seat deleted successfully');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to delete seat');
    } finally {
      setIsDeleting(false);
    }
  };

  const trainOptions = trains.map((t) => ({
    value: t.trainId,
    label: `${t.trainName} (#${t.trainNumber})`,
  }));

  const filterOptions = [
    { value: 'ALL', label: 'All Trains' },
    ...trainOptions,
  ];

  const filteredSeats =
    selectedTrainFilter === 'ALL'
      ? seats
      : seats.filter((s) => s.trainId === selectedTrainFilter);

  const columns: Column<Seat>[] = [
    {
      key: 'seatId',
      header: 'ID',
      render: (s) => <span className="font-mono text-xs font-bold text-slate-700">#{s.seatId}</span>,
    },
    {
      key: 'trainId',
      header: 'Train',
      render: (s) => {
        const tr = trains.find((t) => t.trainId === s.trainId);
        return (
          <span className="font-medium text-slate-800 text-xs">
            {tr ? `${tr.trainName} (#${tr.trainNumber})` : `Train #${s.trainId}`}
          </span>
        );
      },
    },
    {
      key: 'coachNumber',
      header: 'Coach',
      render: (s) => (
        <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded text-xs">
          {s.coachNumber}
        </span>
      ),
    },
    {
      key: 'seatNumber',
      header: 'Seat #',
      render: (s) => <span className="font-mono font-bold text-slate-900 text-xs">#{s.seatNumber}</span>,
    },
    {
      key: 'coachClass',
      header: 'Class',
      render: (s) => <Badge variant="blue" size="sm">{s.coachClass}</Badge>,
    },
    {
      key: 'berthType',
      header: 'Berth Type',
      render: (s) => (
        <span className="text-xs font-medium uppercase text-slate-600">
          {s.berthType}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Seat"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(s.seatId)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Seat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Seat Inventory Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>SEAT</code>: Physical coach layout, berth designations, and carriage classes
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Seat
          </Button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-4">
          <div className="w-full sm:w-80">
            <SearchableSelect
              label="Filter by Train"
              placeholder="Select train..."
              options={filterOptions}
              value={selectedTrainFilter}
              onChange={(val) => setSelectedTrainFilter(val === 'ALL' ? 'ALL' : Number(val))}
            />
          </div>
          <span className="text-xs text-slate-500 self-end pb-2">
            Showing <span className="font-bold text-slate-900">{filteredSeats.length}</span> seat(s)
          </span>
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filteredSeats}
            keyField={(s) => s.seatId}
            isLoading={loading}
            emptyMessage="No seats configured for this train."
          />
        </Card>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSeat ? `Edit Seat #${editingSeat.seatId}` : 'Add New Seat'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <SearchableSelect
                label="Train *"
                placeholder="Choose train..."
                options={trainOptions}
                value={formData.trainId}
                onChange={(val) => setFormData({ ...formData, trainId: Number(val) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Coach Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. S1, B1, A1"
                  value={formData.coachNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, coachNumber: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Seat Number *
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.seatNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, seatNumber: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Coach Class *
                </label>
                <select
                  value={formData.coachClass}
                  onChange={(e) => setFormData({ ...formData, coachClass: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="SL">SL (Sleeper)</option>
                  <option value="3A">3A (AC 3 Tier)</option>
                  <option value="2A">2A (AC 2 Tier)</option>
                  <option value="1A">1A (AC First Class)</option>
                  <option value="CC">CC (AC Chair Car)</option>
                  <option value="2S">2S (Second Sitting)</option>
                  <option value="EC">EC (Executive Chair)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Berth Type *
                </label>
                <select
                  value={formData.berthType}
                  onChange={(e) => setFormData({ ...formData, berthType: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="LOWER">LOWER</option>
                  <option value="MIDDLE">MIDDLE</option>
                  <option value="UPPER">UPPER</option>
                  <option value="SIDE LOWER">SIDE LOWER</option>
                  <option value="SIDE UPPER">SIDE UPPER</option>
                  <option value="WINDOW">WINDOW</option>
                  <option value="AISLE">AISLE</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={formSubmitting}>
                {editingSeat ? 'Save Changes' : 'Create Seat'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={deletingId !== null}
          title="Delete Seat Record"
          message="Are you sure you want to delete this seat? Reservations holding this seat may prevent deletion."
          confirmText="Delete Seat"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
        />
      </div>
    </AdminLayout>
  );
};
