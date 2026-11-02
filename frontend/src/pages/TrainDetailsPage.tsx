import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { DataTable, Column } from '../components/common/DataTable';
import { getTrain, getTrainRoute, getSchedules } from '../../src/services/api';
import type { Train, TrainStop, TrainSchedule } from '../types';
import { Train as TrainIcon, Calendar, ArrowRight, Route, Clock, Armchair } from 'lucide-react';

export const TrainDetailsPage: React.FC = () => {
  const { trainId } = useParams<{ trainId: string }>();
  const [train, setTrain] = useState<Train | null>(null);
  const [routeStops, setRouteStops] = useState<TrainStop[]>([]);
  const [schedules, setSchedules] = useState<TrainSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!trainId) return;
    setLoading(true);
    setError(null);
    try {
      const id = Number(trainId);
      const [trainData, stopsData, allSchedules] = await Promise.all([
        getTrain(id),
        getTrainRoute(id),
        getSchedules(),
      ]);
      setTrain(trainData);
      setRouteStops(stopsData);
      setSchedules(allSchedules.filter((s) => s.trainId === id));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load train details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trainId]);

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner size="lg" message="Loading train route & schedule..." />
      </PageLayout>
    );
  }

  if (error || !train) {
    return (
      <PageLayout>
        <ErrorState
          title="Train Not Found"
          message={error || 'Could not load details for this train.'}
          onRetry={fetchData}
        />
      </PageLayout>
    );
  }

  const originStop = routeStops[0];
  const destStop = routeStops[routeStops.length - 1];

  const stopColumns: Column<TrainStop>[] = [
    {
      key: 'stopSequence',
      header: 'Seq #',
      render: (stop) => (
        <span className="font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
          {stop.stopSequence}
        </span>
      ),
    },
    {
      key: 'stationCode',
      header: 'Station Code',
      render: (stop) => (
        <span className="font-mono font-bold text-blue-600">
          {stop.stationCode || '-'}
        </span>
      ),
    },
    {
      key: 'stationName',
      header: 'Station Name',
      render: (stop) => (
        <span className="font-medium text-slate-900">
          {stop.stationName || `Station #${stop.stationId}`}
        </span>
      ),
    },
    {
      key: 'arrivalTime',
      header: 'Arrival Time',
      render: (stop) => (
        <span className="font-mono text-slate-700">
          {stop.arrivalTime || 'Origin'}
        </span>
      ),
    },
    {
      key: 'departureTime',
      header: 'Departure Time',
      render: (stop) => (
        <span className="font-mono text-slate-700">
          {stop.departureTime || 'Terminus'}
        </span>
      ),
    },
    {
      key: 'distanceFromOriginKm',
      header: 'Distance (KM)',
      render: (stop) => (
        <span className="text-slate-600">
          {stop.distanceFromOriginKm} km
        </span>
      ),
    },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Train Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                <TrainIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {train.trainName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-sm font-bold bg-slate-100 text-slate-800">
                    #{train.trainNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={train.trainType} variant="blue" />
                  <Badge status={train.activeStatus} />
                </div>
              </div>
            </div>

            {originStop && destStop && (
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200/60">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Origin</p>
                  <p className="font-bold text-slate-800">{originStop.stationName || originStop.stationCode}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Destination</p>
                  <p className="font-bold text-slate-800">{destStop.stationName || destStop.stationCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Route Stops Table */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              <span>Route Sequence & Timings</span>
            </div>
          }
          subtitle={`Complete schedule across ${routeStops.length} station stops`}
        >
          <DataTable
            columns={stopColumns}
            data={routeStops}
            keyField={(stop) => stop.stopSequence}
            emptyMessage="No stops configured for this train route."
          />
        </Card>

        {/* Available Schedules */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Upcoming Schedules & Booking</span>
            </div>
          }
          subtitle="Trips scheduled for this train in the database"
        >
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No future schedules active for this train.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((sch) => (
                <div
                  key={sch.scheduleId}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                        Schedule #{sch.scheduleId}
                      </span>
                      <Badge status={sch.scheduleStatus} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Date: {sch.journeyDate}
                    </p>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Departure: {sch.scheduledDeparture?.replace('T', ' ')}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Arrival: {sch.scheduledArrival?.replace('T', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <Link
                      to={`/seats/${sch.scheduleId}`}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Armchair className="w-3.5 h-3.5" /> View Seats
                    </Link>
                    {originStop && destStop && (
                      <Link
                        to={`/book?scheduleId=${sch.scheduleId}&sourceStationId=${originStop.stationId}&destinationStationId=${destStop.stationId}&journeyDate=${sch.journeyDate}`}
                      >
                        <Button size="sm" variant="primary">
                          Book This Trip
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
