import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { getSchedule, getScheduleSeats } from '../services/api';
import type { TrainSchedule, SeatAvailability } from '../types';
import { Armchair, CheckCircle2, XCircle, Filter, ArrowLeft } from 'lucide-react';

export const SeatAvailabilityPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const [schedule, setSchedule] = useState<TrainSchedule | null>(null);
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!scheduleId) return;
    setLoading(true);
    setError(null);
    try {
      const id = Number(scheduleId);
      const [scheduleData, seatsData] = await Promise.all([
        getSchedule(id),
        getScheduleSeats(id),
      ]);
      setSchedule(scheduleData);
      setSeats(seatsData);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load seats for schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [scheduleId]);

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner size="lg" message="Loading coach seat matrix..." />
      </PageLayout>
    );
  }

  if (error || !schedule) {
    return (
      <PageLayout>
        <ErrorState
          title="Schedule Not Found"
          message={error || 'Could not load seat map for this schedule.'}
          onRetry={fetchData}
        />
      </PageLayout>
    );
  }

  // Get distinct classes
  const classes = Array.from(new Set(seats.map((s) => s.coachClass)));
  const classFilterOptions = ['ALL', ...classes];

  const filteredSeats =
    selectedClass === 'ALL'
      ? seats
      : seats.filter((s) => s.coachClass === selectedClass);

  const totalSeats = filteredSeats.length;
  const availableCount = filteredSeats.filter((s) => s.available).length;
  const bookedCount = totalSeats - availableCount;

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={schedule.trainId ? `/trains/${schedule.trainId}` : '/search'}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Train Details
          </Link>
          <Badge status={schedule.scheduleStatus} />
        </div>

        {/* Schedule Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Armchair className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {schedule.trainName || `Train #${schedule.trainNumber}`}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Train #{schedule.trainNumber} • Journey Date: {schedule.journeyDate} • Schedule #{schedule.scheduleId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-center">
                <span className="text-xs font-semibold text-emerald-700 block">Available</span>
                <span className="text-xl font-bold text-emerald-800 font-mono">{availableCount}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-center">
                <span className="text-xs font-semibold text-rose-700 block">Booked</span>
                <span className="text-xl font-bold text-rose-800 font-mono">{bookedCount}</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-center">
                <span className="text-xs font-semibold text-slate-600 block">Total</span>
                <span className="text-xl font-bold text-slate-800 font-mono">{totalSeats}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Class Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Class:
          </span>
          {classFilterOptions.map((cls) => {
            const isSelected = selectedClass === cls;
            const countForCls =
              cls === 'ALL'
                ? seats.length
                : seats.filter((s) => s.coachClass === cls).length;

            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cls} ({countForCls})
              </button>
            );
          })}
        </div>

        {/* Seat Layout Grid */}
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span>Seat Layout & Real-Time Availability</span>
              <div className="flex items-center gap-4 text-xs font-normal">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Available
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Booked
                </span>
              </div>
            </div>
          }
        >
          {filteredSeats.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No seats found for selected coach class.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredSeats.map((seat) => (
                <div
                  key={seat.seatId}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    seat.available
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:border-emerald-400 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {seat.coachNumber}
                    </span>
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                      {seat.coachClass}
                    </span>
                  </div>

                  <div className="text-center py-1">
                    <span className="text-lg font-bold font-mono">
                      #{seat.seatNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium mt-0.5">
                      {seat.berthType}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-center">
                    {seat.available ? (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Booked
                      </span>
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
