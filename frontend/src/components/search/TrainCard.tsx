import React from 'react';
import { Link } from 'react-router-dom';
import type { TrainSearchResult } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Train, Clock, ArrowRight, Armchair, Route } from 'lucide-react';

interface TrainCardProps {
  train: TrainSearchResult;
}

export const TrainCard: React.FC<TrainCardProps> = ({ train }) => {
  // Format departure & arrival
  const formatTime = (timeStr?: string, dateTimeStr?: string) => {
    if (timeStr) return timeStr;
    if (dateTimeStr) {
      try {
        const d = new Date(dateTimeStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) {
        return dateTimeStr;
      }
    }
    return '--:--';
  };

  const depTime = formatTime(train.sourceDepartureTime, train.scheduledDeparture);
  const arrTime = formatTime(train.destArrivalTime, train.scheduledArrival);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900">
                  {train.trainName}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  #{train.trainNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Journey Date: {train.journeyDate}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={train.trainType} variant="blue" />
          <Badge
            variant={train.availableSeats > 0 ? 'green' : 'red'}
            size="md"
          >
            {train.availableSeats > 0
              ? `${train.availableSeats} Seats Available`
              : 'Waitlist / Full'}
          </Badge>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="py-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        {/* Source */}
        <div>
          <span className="text-2xl font-bold text-slate-800 font-mono">
            {depTime}
          </span>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {train.sourceStationName}
          </p>
          <span className="text-xs text-slate-400 font-mono">
            {train.sourceStationCode}
          </span>
        </div>

        {/* Direction icon */}
        <div className="flex flex-col items-center justify-center text-slate-400">
          <div className="flex items-center gap-2 w-full justify-center">
            <div className="h-0.5 bg-slate-200 w-16" />
            <ArrowRight className="w-5 h-5 text-blue-500" />
            <div className="h-0.5 bg-slate-200 w-16" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Scheduled Route
          </span>
        </div>

        {/* Destination */}
        <div className="md:text-right">
          <span className="text-2xl font-bold text-slate-800 font-mono">
            {arrTime}
          </span>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            {train.destinationStationName}
          </p>
          <span className="text-xs text-slate-400 font-mono">
            {train.destinationStationCode}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/trains/${train.trainId}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline p-1"
          >
            <Route className="w-3.5 h-3.5" /> View Full Route
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to={`/seats/${train.scheduleId}`}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 hover:underline p-1"
          >
            <Armchair className="w-3.5 h-3.5" /> Seat Layout
          </Link>
        </div>

        <Link
          to={`/book?scheduleId=${train.scheduleId}&sourceStationId=${train.sourceStationId}&destinationStationId=${train.destinationStationId}&journeyDate=${train.journeyDate}`}
        >
          <Button
            variant="primary"
            size="md"
            disabled={train.availableSeats === 0}
          >
            {train.availableSeats > 0 ? 'Book Ticket' : 'Sold Out'}
          </Button>
        </Link>
      </div>
    </div>
  );
};
