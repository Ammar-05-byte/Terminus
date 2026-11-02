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
  getSchedules,
  getTrains,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../../services/api';
import type { TrainSchedule, Train, ScheduleRequest } from '../../types';
import { Plus, Edit2, Trash2, Search, Armchair } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminSchedulesPage: React.FC = () => {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState<TrainSchedule[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainSchedule | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<ScheduleRequest>({
    trainId: 0,
    journeyDate: '',
    scheduledDeparture: '',
    scheduledArrival: '',
    scheduleStatus: 'SCHEDULED',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schList, trainList] = await Promise.all([
        getSchedules(),
        getTrains(),
      ]);
      setSchedules(schList);
      setTrains(trainList);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      trainId: trains.length > 0 ? trains[0].trainId : 0,
      journeyDate: today,
      scheduledDeparture: `${today}T08:00:00`,
      scheduledArrival: `${today}T20:00:00`,
      scheduleStatus: 'SCHEDULED',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: TrainSchedule) => {
    setEditingSchedule(s);
    setFormData({
      trainId: s.trainId,
      journeyDate: s.journeyDate,
      scheduledDeparture: s.scheduledDeparture || '',
      scheduledArrival: s.scheduledArrival || '',
      scheduleStatus: s.scheduleStatus,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.scheduleId, formData);
        success('Schedule updated successfully');
      } else {
        await createSchedule(formData);
        success('Train schedule created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save schedule');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteSchedule(deletingId);
      success('Schedule deleted successfully');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  const trainOptions = trains.map((t) => ({
    value: t.trainId,
    label: `${t.trainName} (#${t.trainNumber})`,
  }));

  const filtered = schedules.filter(
    (s) =>
      (s.trainName && s.trainName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.trainNumber && s.trainNumber.includes(searchTerm)) ||
      (s.journeyDate && s.journeyDate.includes(searchTerm))
  );

  const columns: Column<TrainSchedule>[] = [
    {
      key: 'scheduleId',
      header: 'ID',
      render: (s) => <span className="font-mono text-xs font-bold text-slate-700">#{s.scheduleId}</span>,
    },
    {
      key: 'train',
      header: 'Train',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-900">{s.trainName || `Train #${s.trainId}`}</span>
          <span className="font-mono text-xs text-slate-500 block">#{s.trainNumber}</span>
        </div>
      ),
    },
    {
      key: 'journeyDate',
      header: 'Journey Date',
      render: (s) => <span className="font-mono font-medium text-slate-800 text-xs">{s.journeyDate}</span>,
    },
    {
      key: 'scheduledDeparture',
      header: 'Departure',
      render: (s) => (
        <span className="text-xs text-slate-700 font-mono">
          {s.scheduledDeparture ? s.scheduledDeparture.replace('T', ' ') : '-'}
        </span>
      ),
    },
    {
      key: 'scheduledArrival',
      header: 'Arrival',
      render: (s) => (
        <span className="text-xs text-slate-700 font-mono">
          {s.scheduledArrival ? s.scheduledArrival.replace('T', ' ') : '-'}
        </span>
      ),
    },
    {
      key: 'scheduleStatus',
      header: 'Status',
      render: (s) => <Badge status={s.scheduleStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/seats/${s.scheduleId}`}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="View Seat Availability"
          >
            <Armchair className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Schedule"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(s.scheduleId)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Schedule"
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
            <h1 className="text-2xl font-bold text-slate-900">Schedule Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>TRAIN_SCHEDULE</code>: Dated timetable instances and trip operational statuses
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Schedule
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search by train name, number, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm focus:outline-none placeholder-slate-400 text-slate-800"
          />
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            keyField={(s) => s.scheduleId}
            isLoading={loading}
            emptyMessage="No train schedules found."
          />
        </Card>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSchedule ? `Edit Schedule #${editingSchedule.scheduleId}` : 'Add Train Schedule'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <SearchableSelect
                label="Train *"
                placeholder="Select train..."
                options={trainOptions}
                value={formData.trainId}
                onChange={(val) => setFormData({ ...formData, trainId: Number(val) })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Journey Date *
              </label>
              <input
                type="date"
                value={formData.journeyDate}
                onChange={(e) => setFormData({ ...formData, journeyDate: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Scheduled Departure *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDeparture}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDeparture: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Scheduled Arrival *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledArrival}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledArrival: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Schedule Status *
              </label>
              <select
                value={formData.scheduleStatus}
                onChange={(e) => setFormData({ ...formData, scheduleStatus: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DELAYED">DELAYED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
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
                {editingSchedule ? 'Save Changes' : 'Create Schedule'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={deletingId !== null}
          title="Delete Schedule"
          message="Are you sure you want to delete this train schedule?"
          confirmText="Delete Schedule"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
        />
      </div>
    </AdminLayout>
  );
};
