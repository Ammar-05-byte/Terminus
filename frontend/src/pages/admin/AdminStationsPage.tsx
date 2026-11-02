import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import {
  getStations,
  createStation,
  updateStation,
  deleteStation,
} from '../../services/api';
import type { Station, StationRequest } from '../../types';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export const AdminStationsPage: React.FC = () => {
  const { success, error } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<StationRequest>({
    stationCode: '',
    stationName: '',
    city: '',
    state: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getStations();
      setStations(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStation(null);
    setFormData({
      stationCode: '',
      stationName: '',
      city: '',
      state: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Station) => {
    setEditingStation(s);
    setFormData({
      stationCode: s.stationCode,
      stationName: s.stationName,
      city: s.city,
      state: s.state,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingStation) {
        await updateStation(editingStation.stationId, formData);
        success('Station updated successfully');
      } else {
        await createStation(formData);
        success('Station created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save station');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteStation(deletingId);
      success('Station deleted successfully');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to delete station (may have routes/schedules linked)');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStations = stations.filter(
    (s) =>
      s.stationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Station>[] = [
    {
      key: 'stationId',
      header: 'ID',
      render: (s) => <span className="font-mono text-xs font-bold text-slate-700">#{s.stationId}</span>,
    },
    {
      key: 'stationCode',
      header: 'Code',
      render: (s) => (
        <span className="font-mono font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">
          {s.stationCode}
        </span>
      ),
    },
    {
      key: 'stationName',
      header: 'Station Name',
      render: (s) => <span className="font-semibold text-slate-900">{s.stationName}</span>,
    },
    {
      key: 'city',
      header: 'City',
      render: (s) => <span className="text-slate-700">{s.city}</span>,
    },
    {
      key: 'state',
      header: 'State',
      render: (s) => <span className="text-slate-600 text-xs">{s.state}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Station"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(s.stationId)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Station"
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
            <h1 className="text-2xl font-bold text-slate-900">Station Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>STATION</code>: Network junction nodes, codes, and geographical distribution
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Station
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search by station code, name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm focus:outline-none placeholder-slate-400 text-slate-800"
          />
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filteredStations}
            keyField={(s) => s.stationId}
            isLoading={loading}
            emptyMessage="No railway stations found."
          />
        </Card>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStation ? `Edit Station ${editingStation.stationCode}` : 'Add Railway Station'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Station Code (2 to 5 characters) *
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.stationCode}
                onChange={(e) =>
                  setFormData({ ...formData, stationCode: e.target.value.toUpperCase() })
                }
                placeholder="e.g. NDLS"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Station Name *
              </label>
              <input
                type="text"
                value={formData.stationName}
                onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
                placeholder="New Delhi Junction"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New Delhi"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Delhi"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
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
                {editingStation ? 'Save Changes' : 'Create Station'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={deletingId !== null}
          title="Delete Station Record"
          message="Are you sure you want to delete this station? Ensure no routes or schedules reference it."
          confirmText="Delete Station"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
        />
      </div>
    </AdminLayout>
  );
};
