import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import {
  getTrains,
  createTrain,
  updateTrain,
  deleteTrain,
} from '../../services/api';
import type { Train, TrainRequest } from '../../types';
import { Plus, Edit2, Trash2, Search, Route } from 'lucide-react';

export const AdminTrainsPage: React.FC = () => {
  const { success, error } = useToast();
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<TrainRequest>({
    trainNumber: '',
    trainName: '',
    trainType: 'EXPRESS',
    activeStatus: 'ACTIVE',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTrains();
      setTrains(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch trains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTrain(null);
    setFormData({
      trainNumber: '',
      trainName: '',
      trainType: 'EXPRESS',
      activeStatus: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Train) => {
    setEditingTrain(t);
    setFormData({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      trainType: t.trainType,
      activeStatus: t.activeStatus,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingTrain) {
        await updateTrain(editingTrain.trainId, formData);
        success('Train updated successfully');
      } else {
        await createTrain(formData);
        success('Train registered into fleet');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save train');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteTrain(deletingId);
      success('Train deleted from fleet');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to delete train');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTrains = trains.filter(
    (t) =>
      t.trainNumber.includes(searchTerm) ||
      t.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.trainType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Train>[] = [
    {
      key: 'trainId',
      header: 'ID',
      render: (t) => <span className="font-mono text-xs font-bold text-slate-700">#{t.trainId}</span>,
    },
    {
      key: 'trainNumber',
      header: 'Train #',
      render: (t) => (
        <span className="font-mono font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">
          {t.trainNumber}
        </span>
      ),
    },
    {
      key: 'trainName',
      header: 'Train Name',
      render: (t) => <span className="font-semibold text-slate-900">{t.trainName}</span>,
    },
    {
      key: 'trainType',
      header: 'Type',
      render: (t) => <Badge status={t.trainType} variant="blue" />,
    },
    {
      key: 'activeStatus',
      header: 'Status',
      render: (t) => <Badge status={t.activeStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/routes?trainId=${t.trainId}`}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Manage Stops & Route"
          >
            <Route className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleOpenEdit(t)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Train"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(t.trainId)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Train"
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
            <h1 className="text-2xl font-bold text-slate-900">Train Fleet Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>TRAIN</code>: Locomotive fleet records, service classes, and active designations
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Train
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search by train number, name, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm focus:outline-none placeholder-slate-400 text-slate-800"
          />
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filteredTrains}
            keyField={(t) => t.trainId}
            isLoading={loading}
            emptyMessage="No trains found in fleet."
          />
        </Card>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTrain ? `Edit Train #${editingTrain.trainNumber}` : 'Register New Train'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Train Number (5 digits) *
              </label>
              <input
                type="text"
                maxLength={5}
                pattern="[0-9]{5}"
                value={formData.trainNumber}
                onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                placeholder="e.g. 12951"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Train Name *
              </label>
              <input
                type="text"
                value={formData.trainName}
                onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                placeholder="Mumbai Rajdhani Express"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Train Type *
                </label>
                <select
                  value={formData.trainType}
                  onChange={(e) => setFormData({ ...formData, trainType: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="EXPRESS">EXPRESS</option>
                  <option value="SUPERFAST">SUPERFAST</option>
                  <option value="RAJDHANI">RAJDHANI</option>
                  <option value="SHATABDI">SHATABDI</option>
                  <option value="VANDE_BHARAT">VANDE BHARAT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Active Status *
                </label>
                <select
                  value={formData.activeStatus}
                  onChange={(e) => setFormData({ ...formData, activeStatus: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
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
                {editingTrain ? 'Save Changes' : 'Register Train'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={deletingId !== null}
          title="Delete Train Record"
          message="Are you sure you want to remove this train? Associated routes and schedules might prevent deletion."
          confirmText="Delete Train"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
        />
      </div>
    </AdminLayout>
  );
};
