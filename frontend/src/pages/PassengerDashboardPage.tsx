import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DataTable, Column } from '../components/common/DataTable';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { getPassengers, getPassengerReservations } from '../services/api';
import type { Passenger, ReservationDetails } from '../types';
import {
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  PlusCircle,
  Search,
  ExternalLink,
} from 'lucide-react';

export const PassengerDashboardPage: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<ReservationDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resLoading, setResLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const list = await getPassengers();
        setPassengers(list);
        if (list.length > 0) {
          setSelectedPassengerId(list[0].passengerId);
        }
      } catch (err) {
        console.error('Failed to load passengers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPassengers();
  }, []);

  useEffect(() => {
    if (!selectedPassengerId) return;
    const fetchReservations = async () => {
      setResLoading(true);
      try {
        const list = await getPassengerReservations(selectedPassengerId);
        setReservations(list);
      } catch (err) {
        console.error('Failed to load passenger reservations', err);
        setReservations([]);
      } finally {
        setResLoading(false);
      }
    };
    fetchReservations();
  }, [selectedPassengerId]);

  const selectedPassenger = passengers.find((p) => p.passengerId === selectedPassengerId);

  const confirmedCount = reservations.filter((r) => r.bookingStatus === 'CONFIRMED').length;
  const pendingCount = reservations.filter((r) => r.bookingStatus === 'PENDING').length;
  const cancelledCount = reservations.filter((r) => r.bookingStatus === 'CANCELLED').length;

  const passengerOptions = passengers.map((p) => ({
    value: p.passengerId,
    label: `${p.fullName} (${p.phone})`,
    sublabel: `${p.email} • ID #${p.passengerId}`,
  }));

  const columns: Column<ReservationDetails>[] = [
    {
      key: 'pnr',
      header: 'PNR',
      render: (r) => (
        <Link
          to={`/pnr?pnr=${r.pnr}`}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
        >
          {r.pnr} <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
    {
      key: 'train',
      header: 'Train',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800">{r.trainName}</span>
          <span className="text-xs text-slate-400 block font-mono">#{r.trainNumber}</span>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <span className="text-xs font-medium text-slate-700">
          {r.sourceStationCode} → {r.destinationStationCode}
        </span>
      ),
    },
    {
      key: 'journeyDate',
      header: 'Journey Date',
      render: (r) => <span className="text-xs font-mono text-slate-700">{r.journeyDate}</span>,
    },
    {
      key: 'seat',
      header: 'Seat',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {r.coachNumber}-{r.seatNumber} ({r.coachClass})
        </span>
      ),
    },
    {
      key: 'fareAmount',
      header: 'Fare',
      render: (r) => <span className="font-bold text-slate-900">₹{r.fareAmount}</span>,
    },
    {
      key: 'bookingStatus',
      header: 'Status',
      render: (r) => <Badge status={r.bookingStatus} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Link to={`/pnr?pnr=${r.pnr}`}>
            <Button size="sm" variant="outline">
              Details
            </Button>
          </Link>
          {r.bookingStatus !== 'CANCELLED' && (
            <Link to={`/cancel?pnr=${r.pnr}`}>
              <Button size="sm" variant="danger">
                Cancel
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner size="lg" message="Loading passenger hub..." />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Passenger Hub</h1>
            <p className="text-xs text-slate-500 mt-1">
              Personalized traveler dashboard & reservation history
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book">
              <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Book New Ticket
              </Button>
            </Link>
            <Link to="/pnr">
              <Button variant="outline" size="md" leftIcon={<Search className="w-4 h-4" />}>
                Lookup PNR
              </Button>
            </Link>
          </div>
        </div>

        {/* Passenger Profile Selector */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <SearchableSelect
              label="Switch Active Passenger"
              placeholder="Select passenger profile..."
              options={passengerOptions}
              value={selectedPassengerId}
              onChange={(val) => setSelectedPassengerId(Number(val))}
            />

            {selectedPassenger && (
              <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 text-sm">
                  {selectedPassenger.fullName} (Passenger #{selectedPassenger.passengerId})
                </p>
                <div className="flex flex-wrap gap-4 text-slate-600">
                  <span>Phone: {selectedPassenger.phone}</span>
                  <span>Email: {selectedPassenger.email}</span>
                  <span>DOB: {selectedPassenger.dateOfBirth}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Bookings"
            value={reservations.length}
            icon={<Ticket className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Confirmed"
            value={confirmedCount}
            icon={<CheckCircle className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            label="Cancelled"
            value={cancelledCount}
            icon={<XCircle className="w-5 h-5" />}
            color="rose"
          />
        </div>

        {/* Bookings Table */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span>Travel Bookings</span>
            </div>
          }
          subtitle={`Found ${reservations.length} booking records for this passenger`}
        >
          {resLoading ? (
            <LoadingSpinner size="md" message="Loading passenger reservations..." />
          ) : (
            <DataTable
              columns={columns}
              data={reservations}
              keyField={(r) => r.reservationId}
              emptyMessage="No reservations found for this passenger."
            />
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
