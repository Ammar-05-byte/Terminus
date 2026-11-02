import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchableSelect } from '../common/SearchableSelect';
import { Button } from '../common/Button';
import { getStations } from '../../services/api';
import type { Station } from '../../types';
import { Search, ArrowRightLeft } from 'lucide-react';

interface SearchFormProps {
  initialSource?: string | number;
  initialDest?: string | number;
  initialDate?: string;
  onSearch?: (sourceId: number, destId: number, date: string) => void;
  className?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  initialSource,
  initialDest,
  initialDate,
  onSearch,
  className = '',
}) => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [sourceId, setSourceId] = useState<number | null>(
    initialSource ? Number(initialSource) : null
  );
  const [destId, setDestId] = useState<number | null>(
    initialDest ? Number(initialDest) : null
  );
  const [journeyDate, setJourneyDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await getStations();
        setStations(data);
        if (!sourceId && data.length > 0) {
          // If no initial, leave null or default
        }
      } catch (err) {
        console.error('Failed to load stations', err);
      }
    };
    fetchStations();
  }, []);

  const stationOptions = stations.map((s) => ({
    value: s.stationId,
    label: `${s.stationName} (${s.stationCode})`,
    sublabel: `${s.city}, ${s.state}`,
  }));

  const handleSwap = () => {
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId) {
      setError('Please select both source and destination stations.');
      return;
    }
    if (sourceId === destId) {
      setError('Source and destination stations cannot be the same.');
      return;
    }
    if (!journeyDate) {
      setError('Please select a journey date.');
      return;
    }

    setError(null);

    if (onSearch) {
      onSearch(sourceId, destId, journeyDate);
    } else {
      navigate(`/search?sourceStationId=${sourceId}&destStationId=${destId}&journeyDate=${journeyDate}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-6 ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Source Station */}
        <div className="md:col-span-4">
          <SearchableSelect
            label="From Station"
            placeholder="Select departure station"
            options={stationOptions}
            value={sourceId}
            onChange={(val) => setSourceId(val ? Number(val) : null)}
            required
          />
        </div>

        {/* Swap button */}
        <div className="hidden md:flex md:col-span-1 justify-center pb-2">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 rounded-full hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
            title="Swap stations"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Station */}
        <div className="md:col-span-4">
          <SearchableSelect
            label="To Station"
            placeholder="Select destination station"
            options={stationOptions}
            value={destId}
            onChange={(val) => setDestId(val ? Number(val) : null)}
            required
          />
        </div>

        {/* Journey Date */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Journey Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Search className="w-5 h-5" />}
          className="w-full md:w-auto"
        >
          Search Trains
        </Button>
      </div>
    </form>
  );
};
