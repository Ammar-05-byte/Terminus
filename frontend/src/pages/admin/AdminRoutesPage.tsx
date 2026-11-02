import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { DataTable, Column } from '../../components/common/DataTable';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { useToast } from '../../context/ToastContext';
import {
  getTrains,
  getStations,
  getTrainRoute,
  addTrainStop,
} from '../../services/api';
import type { Train, Station, TrainStop, TrainStopRequest } from '../../types';
import { Route, Plus } from 'lucide-react';

export const AdminRoutesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTrainId = searchParams.get('trainId');
  const { success, error } = useToast();

  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<number | null>(
    initialTrainId ? Number(initialTrainId) : null
  );
  const [stops, setStops] = useState<TrainStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState<boolean>(false);

  // Add stop modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<TrainStopRequest>({
    stopSequence: 1,
    stationId: 0,
    arrivalTime: '08:00',
    departureTime: '08:15',
    distanceFromOriginKm: 0,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [trainList, stationList] = await Promise.all([
          getTrains(),
          getStations(),
        ]);
        setTrains(trainList);
        setStations(stationList);
        if (!selectedTrainId && trainList.length > 0) {
          setSelectedTrainId(trainList[0].trainId);
        }
      } catch (err: any) {
        error('Failed to load trains or stations');
      }
    };
    init();
  }, []);

  const fetchStops = async (tId: number) => {
    setStopsLoading(true);
    try {
      const data = await getTrainRoute(tId);
      setStops(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to fetch train route');
      setStops([]);
    } finally {
      setStopsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrainId) {
      setSearchParams({ trainId: String(selectedTrainId) });
      fetchStops(selectedTrainId);
    }
  }, [selectedTrainId]);

  const handleOpenAdd = () => {
    const nextSeq = stops.length > 0 ? Math.max(...stops.map((s) => s.stopSequence)) + 1 : 1;
    setFormData({
      stopSequence: nextSeq,
      stationId: stations.length > 0 ? stations[0].stationId : 0,
      arrivalTime: '10:00',
      departureTime: '10:10',
      distanceFromOriginKm: stops.length > 0 ? (stops[stops.length - 1].distanceFromOriginKm || 0) + 50 : 0,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainId) return;
    setFormSubmitting(true);
    try {
      await addTrainStop(selectedTrainId, formData);
      success('Stop added to train route successfully');
      setIsModalOpen(false);
      fetchStops(selectedTrainId);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to add stop');
    } finally {
      setFormSubmitting(false);
    }
  };

  const trainOptions = trains.map((t) => ({
    value: t.trainId,
    label: `${t.trainName} (#${t.trainNumber})`,
    sublabel: `${t.trainType} • ${t.activeStatus}`,
  }));

  const stationOptions = stations.map((s) => ({
    value: s.stationId,
    label: `${s.stationName} (${s.stationCode})`,
    sublabel: `${s.city}, ${s.state}`,
  }));

  const selectedTrain = trains.find((t) => t.trainId === selectedTrainId);

  const columns: Column<TrainStop>[] = [
    {
      key: 'stopSequence',
      header: 'Seq #',
      render: (s) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
          {s.stopSequence}
        </span>
      ),
    },
    {
      key: 'stationCode',
      header: 'Station Code',
      render: (s) => (
        <span className="font-mono font-bold text-blue-600">
          {s.stationCode || '-'}
        </span>
      ),
    },
    {
      key: 'stationName',
      header: 'Station Name',
      render: (s) => <span className="font-semibold text-slate-800">{s.stationName || `Station #${s.stationId}`}</span>,
    },
    {
      key: 'arrivalTime',
      header: 'Arrival Time',
      render: (s) => <span className="font-mono text-slate-700">{s.arrivalTime || 'Origin'}</span>,
    },
    {
      key: 'departureTime',
      header: 'Departure Time',
      render: (s) => <span className="font-mono text-slate-700">{s.departureTime || 'Terminus'}</span>,
    },
    {
      key: 'distanceFromOriginKm',
      header: 'Distance (KM)',
      render: (s) => <span className="font-mono text-slate-700">{s.distanceFromOriginKm} km</span>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Route & Stops Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Table <code>TRAIN_STOP</code>: Sequential station stops, arrival/departure schedules, and cumulative distance
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
            disabled={!selectedTrainId}
          >
            Add Route Stop
          </Button>
        </div>

        {/* Train Selector */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="max-w-md">
            <SearchableSelect
              label="Select Train"
              placeholder="Search train by name or number..."
              options={trainOptions}
              value={selectedTrainId}
              onChange={(val) => setSelectedTrainId(Number(val))}
            />
          </div>
        </div>

        {/* Stops Table */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              <span>
                {selectedTrain ? `${selectedTrain.trainName} (#${selectedTrain.trainNumber})` : 'Train'} Route Stops
              </span>
            </div>
          }
          subtitle={`${stops.length} stop(s) ordered by sequence`}
        >
          <DataTable
            columns={columns}
            data={stops}
            keyField={(s) => s.stopSequence}
            isLoading={stopsLoading}
            emptyMessage="No stops configured for this train route."
          />
        </Card>

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Add Stop to ${selectedTrain?.trainName || 'Train'}`}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Stop Sequence # *
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.stopSequence}
                  onChange={(e) =>
                    setFormData({ ...formData, stopSequence: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Distance From Origin (KM) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={formData.distanceFromOriginKm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distanceFromOriginKm: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <SearchableSelect
                label="Station *"
                placeholder="Choose station..."
                options={stationOptions}
                value={formData.stationId}
                onChange={(val) => setFormData({ ...formData, stationId: Number(val) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Arrival Time (HH:mm) *
                </label>
                <input
                  type="text"
                  placeholder="08:00"
                  value={formData.arrivalTime}
                  onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Departure Time (HH:mm) *
                </label>
                <input
                  type="text"
                  placeholder="08:15"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono"
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
                Add Route Stop
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
