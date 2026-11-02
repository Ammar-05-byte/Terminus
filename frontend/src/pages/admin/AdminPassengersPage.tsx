import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, Column } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import {
  getPassengers,
  createPassenger,
  updatePassenger,
  deletePassenger,
} from '../../services/api';
import type { Passenger, PassengerRequest } from '../../types';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export const AdminPassengersPage: React.FC = () => {
  const { success, error } = useToast();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form fields
  const [formData, setFormData] = useState<PassengerRequest>({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    email: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getPassengers();
      setPassengers(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch passengers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingPassenger(null);
    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: 'Male',
      phone: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Passenger) => {
    setEditingPassenger(p);
    setFormData({
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingPassenger) {
        await updatePassenger(editingPassenger.passengerId, formData);
        success('Passenger updated successfully');
      } else {
        await createPassenger(formData);
        success('Passenger registered successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save passenger');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deletePassenger(deletingId);
      success('Passenger record deleted');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to delete passenger');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPassengers = passengers.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Passenger>[] = [
    {
      key: 'passengerId',
      header: 'ID',
      render: (p) => <span className="font-mono text-xs font-bold text-slate-700">#{p.passengerId}</span>,
    },
    {
      key: 'fullName',
      header: 'Full Name',
      render: (p) => <span className="font-semibold text-slate-900">{p.fullName}</span>,
    },
    {
      key: 'dateOfBirth',
      header: 'Date of Birth',
      render: (p) => <span className="text-slate-600 font-mono text-xs">{p.dateOfBirth}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (p) => (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
          {p.gender === 'M' || p.gender === 'Male'
            ? 'Male'
            : p.gender === 'F' || p.gender === 'Female'
            ? 'Female'
            : 'Other'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (p) => <span className="text-slate-700 font-mono text-xs">{p.phone}</span>,
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (p) => <span className="text-slate-600 text-xs">{p.email}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(p)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Passenger"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingId(p.passengerId)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Passenger"
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
            <h1 className="text-2xl font-bold text-slate-900">Passenger Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>PASSENGER</code>: User profiles, demographic details, and credentials
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add Passenger
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm focus:outline-none placeholder-slate-400 text-slate-800"
          />
        </div>

        {/* Data Table */}
        <Card>
          <DataTable
            columns={columns}
            data={filteredPassengers}
            keyField={(p) => p.passengerId}
            isLoading={loading}
            emptyMessage="No passenger records found matching criteria."
          />
        </Card>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPassenger ? `Edit Passenger #${editingPassenger.passengerId}` : 'Add New Passenger'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ramesh Sharma"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (10 digits) *
              </label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="passenger@example.com"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
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
                {editingPassenger ? 'Save Changes' : 'Create Passenger'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={deletingId !== null}
          title="Delete Passenger Record"
          message="Are you sure you want to delete this passenger? This action may fail if foreign key constraints exist on reservations."
          confirmText="Delete Passenger"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
        />
      </div>
    </AdminLayout>
  );
};
