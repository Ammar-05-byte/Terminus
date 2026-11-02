import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { SearchForm } from '../components/search/SearchForm';
import { TrainCard } from '../components/search/TrainCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { searchTrains } from '../services/api';
import type { TrainSearchResult } from '../types';
import { Train } from 'lucide-react';

export const TrainSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sourceStationId = searchParams.get('sourceStationId');
  const destStationId = searchParams.get('destStationId');
  const journeyDate = searchParams.get('journeyDate');

  const [trains, setTrains] = useState<TrainSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (sId: number, dId: number, date: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchTrains(sId, dId, date);
      setTrains(results);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Failed to retrieve train schedules for selected route.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sourceStationId && destStationId && journeyDate) {
      fetchResults(Number(sourceStationId), Number(destStationId), journeyDate);
    }
  }, [sourceStationId, destStationId, journeyDate]);

  const handleSearch = (sId: number, dId: number, date: string) => {
    setSearchParams({
      sourceStationId: String(sId),
      destStationId: String(dId),
      journeyDate: date,
    });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search Trains</h1>
          <p className="text-xs text-slate-500 mt-1">
            Query available railway schedules and seat inventory
          </p>
        </div>

        {/* Top Search Form */}
        <SearchForm
          initialSource={sourceStationId || undefined}
          initialDest={destStationId || undefined}
          initialDate={journeyDate || undefined}
          onSearch={handleSearch}
        />

        {/* Results Section */}
        <div className="mt-8">
          {loading && (
            <LoadingSpinner size="lg" message="Searching train routes and real-time seats..." />
          )}

          {!loading && error && (
            <ErrorState
              title="Search Error"
              message={error}
              onRetry={() => {
                if (sourceStationId && destStationId && journeyDate) {
                  fetchResults(
                    Number(sourceStationId),
                    Number(destStationId),
                    journeyDate
                  );
                }
              }}
            />
          )}

          {!loading && !error && (!sourceStationId || !destStationId) && (
            <EmptyState
              icon={<Train className="w-10 h-10 text-slate-400" />}
              title="Select Origin and Destination"
              message="Please select source station, destination station, and journey date above to find connecting trains."
            />
          )}

          {!loading && !error && sourceStationId && destStationId && trains.length === 0 && (
            <EmptyState
              icon={<Train className="w-10 h-10 text-slate-400" />}
              title="No Trains Found"
              message="No trains are scheduled between the selected stations on this date. Try choosing another date or route."
            />
          )}

          {!loading && !error && trains.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Found <span className="text-blue-600 font-bold">{trains.length}</span> Train{trains.length > 1 ? 's' : ''}
                </p>
                <span className="text-xs text-slate-400">
                  Prices calculate dynamically based on distance & coach class
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {trains.map((train) => (
                  <TrainCard key={train.scheduleId} train={train} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
