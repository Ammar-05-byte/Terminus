import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { StepIndicator, Step } from '../components/common/StepIndicator';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { useToast } from '../context/ToastContext';
import {
  getPassengers,
  createPassenger,
  getStations,
  getSchedules,
  getScheduleSeats,
  bookTicket,
} from '../services/api';
import type {
  Passenger,
  Station,
  TrainSchedule,
  SeatAvailability,
  BookingResponse,
} from '../types';
import {
  User,
  Plus,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Armchair,
  Train,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';

const steps: Step[] = [
  { id: 1, label: 'Passenger', description: 'Select or register' },
  { id: 2, label: 'Journey', description: 'Train & Route' },
  { id: 3, label: 'Seat Selection', description: 'Coach & Berth' },
  { id: 4, label: 'Payment', description: 'Method & Demo' },
  { id: 5, label: 'Confirmation', description: 'PNR Generated' },
];

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Common data
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [schedules, setSchedules] = useState<TrainSchedule[]>([]);

  // Step 1: Passenger state
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null);
  const [showNewPassengerForm, setShowNewPassengerForm] = useState<boolean>(false);
  const [newPassenger, setNewPassenger] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'M',
    phone: '',
    email: '',
  });

  // Step 2: Journey state
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(
    searchParams.get('sourceStationId') ? Number(searchParams.get('sourceStationId')) : null
  );
  const [selectedDestId, setSelectedDestId] = useState<number | null>(
    searchParams.get('destinationStationId')
      ? Number(searchParams.get('destinationStationId'))
      : null
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    searchParams.get('scheduleId') ? Number(searchParams.get('scheduleId')) : null
  );

  // Step 3: Seat selection
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatAvailability | null>(null);
  const [selectedCoachClass, setSelectedCoachClass] = useState<string>('ALL');

  // Step 4: Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [simulatedStatus, setSimulatedStatus] = useState<string>('SUCCESS');

  // Step 5: Booking result
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // Load initial options
  useEffect(() => {
    const init = async () => {
      try {
        const [passList, stationList, scheduleList] = await Promise.all([
          getPassengers(),
          getStations(),
          getSchedules(),
        ]);
        setPassengers(passList);
        setStations(stationList);
        setSchedules(scheduleList);

        if (passList.length > 0) {
          setSelectedPassengerId(passList[0].passengerId);
        }
      } catch (err) {
        console.error('Failed to load initial booking data', err);
      }
    };
    init();
  }, []);

  // When schedule changes, load its seats
  useEffect(() => {
    if (selectedScheduleId) {
      const loadSeats = async () => {
        try {
          const seatData = await getScheduleSeats(selectedScheduleId);
          setSeats(seatData);
        } catch (err) {
          console.error('Failed to load seats', err);
        }
      };
      loadSeats();
    }
  }, [selectedScheduleId]);

  // Handle passenger registration
  const handleCreatePassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassenger.fullName || !newPassenger.phone || !newPassenger.email || !newPassenger.dateOfBirth) {
      error('Please fill in all passenger fields');
      return;
    }
    setLoading(true);
    try {
      const created = await createPassenger(newPassenger);
      setPassengers((prev) => [created, ...prev]);
      setSelectedPassengerId(created.passengerId);
      setShowNewPassengerForm(false);
      success('Passenger registered successfully!');
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to create passenger');
    } finally {
      setLoading(false);
    }
  };

  // Step validation handlers
  const handleNextFromStep1 = () => {
    if (!selectedPassengerId) {
      error('Please select or register a passenger');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!selectedSourceId || !selectedDestId || !selectedScheduleId) {
      error('Please select source, destination, and train schedule');
      return;
    }
    if (selectedSourceId === selectedDestId) {
      error('Source and destination stations cannot be the same');
      return;
    }
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    if (!selectedSeat) {
      error('Please select an available seat');
      return;
    }
    setCurrentStep(4);
  };

  // Step 4 final booking submission calling P_BOOK_TICKET
  const handleFinalBooking = async () => {
    if (!selectedPassengerId || !selectedScheduleId || !selectedSourceId || !selectedDestId || !selectedSeat) {
      error('Incomplete reservation details');
      return;
    }

    setLoading(true);
    try {
      const res = await bookTicket({
        passengerId: selectedPassengerId,
        scheduleId: selectedScheduleId,
        sourceStationId: selectedSourceId,
        destinationStationId: selectedDestId,
        seatId: selectedSeat.seatId,
        paymentMethod,
        simulatedPaymentStatus: simulatedStatus,
      });

      setBookingResult(res);
      setCurrentStep(5);
      if (res.bookingStatus === 'CONFIRMED') {
        success(`Booking CONFIRMED! PNR: ${res.pnr}`);
      } else {
        error(`Booking PENDING: ${res.message || 'Payment simulation pending'}`);
      }
    } catch (err: any) {
      error(err?.response?.data?.message || 'Database error while booking ticket');
    } finally {
      setLoading(false);
    }
  };

  // Passenger options
  const passengerOptions = passengers.map((p) => ({
    value: p.passengerId,
    label: `${p.fullName} (${p.phone})`,
    sublabel: `${p.email} • ${p.gender}`,
  }));

  const stationOptions = stations.map((s) => ({
    value: s.stationId,
    label: `${s.stationName} (${s.stationCode})`,
    sublabel: `${s.city}, ${s.state}`,
  }));

  // Selected details
  const activePassenger = passengers.find((p) => p.passengerId === selectedPassengerId);
  const activeSchedule = schedules.find((s) => s.scheduleId === selectedScheduleId);
  const activeSource = stations.find((s) => s.stationId === selectedSourceId);
  const activeDest = stations.find((s) => s.stationId === selectedDestId);

  // Filter seats by class
  const coachClasses = Array.from(new Set(seats.map((s) => s.coachClass)));
  const filteredSeats =
    selectedCoachClass === 'ALL'
      ? seats
      : seats.filter((s) => s.coachClass === selectedCoachClass);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Book Train Ticket</h1>
          <p className="text-xs text-slate-500 mt-1">
            ACID-compliant reservation executing stored procedure <code>P_BOOK_TICKET</code>
          </p>
        </div>

        {/* Wizard Step Indicator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={(id) => {
              if (id < currentStep && currentStep !== 5) {
                setCurrentStep(id);
              }
            }}
          />
        </div>

        {/* STEP 1: PASSENGER SELECTION */}
        {currentStep === 1 && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Step 1: Passenger Details</span>
              </div>
            }
            subtitle="Choose an existing passenger or register a new traveler"
          >
            {!showNewPassengerForm ? (
              <div className="space-y-5">
                <SearchableSelect
                  label="Select Passenger"
                  placeholder="Search passenger by name or phone..."
                  options={passengerOptions}
                  value={selectedPassengerId}
                  onChange={(val) => setSelectedPassengerId(Number(val))}
                  required
                />

                {activePassenger && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm">
                    <p className="font-semibold text-slate-800">{activePassenger.fullName}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block">Phone:</span>
                        {activePassenger.phone}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Email:</span>
                        {activePassenger.email}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Gender:</span>
                        {activePassenger.gender === 'M' ? 'Male' : activePassenger.gender === 'F' ? 'Female' : 'Other'}
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date of Birth:</span>
                        {activePassenger.dateOfBirth}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowNewPassengerForm(true)}
                  >
                    Register New Passenger
                  </Button>
                  <Button
                    variant="primary"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleNextFromStep1}
                  >
                    Continue to Journey
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePassenger} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newPassenger.fullName}
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, fullName: e.target.value })
                      }
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={newPassenger.dateOfBirth}
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, dateOfBirth: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Gender *
                    </label>
                    <select
                      value={newPassenger.gender}
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, gender: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      required
                    >
                      <option value="M">Male (M)</option>
                      <option value="F">Female (F)</option>
                      <option value="O">Other (O)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      pattern="[0-9]{10}"
                      value={newPassenger.phone}
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, phone: e.target.value })
                      }
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newPassenger.email}
                      onChange={(e) =>
                        setNewPassenger({ ...newPassenger, email: e.target.value })
                      }
                      placeholder="ramesh@example.com"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPassengerForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={loading}>
                    Save Passenger
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* STEP 2: JOURNEY DETAILS */}
        {currentStep === 2 && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <Train className="w-5 h-5 text-blue-600" />
                <span>Step 2: Journey & Train Schedule</span>
              </div>
            }
            subtitle="Configure boarding, destination, and select trip schedule"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Source Station"
                  placeholder="Select source station..."
                  options={stationOptions}
                  value={selectedSourceId}
                  onChange={(val) => setSelectedSourceId(Number(val))}
                  required
                />
                <SearchableSelect
                  label="Destination Station"
                  placeholder="Select destination station..."
                  options={stationOptions}
                  value={selectedDestId}
                  onChange={(val) => setSelectedDestId(Number(val))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Train Schedule *
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {schedules.length === 0 ? (
                    <p className="text-sm text-slate-500">No schedules found in system.</p>
                  ) : (
                    schedules.map((sch) => {
                      const isSelected = sch.scheduleId === selectedScheduleId;
                      return (
                        <div
                          key={sch.scheduleId}
                          onClick={() => setSelectedScheduleId(sch.scheduleId)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {sch.trainName || `Train #${sch.trainNumber}`}
                              </span>
                              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                                #{sch.trainNumber}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Journey Date: {sch.journeyDate} • Dep: {sch.scheduledDeparture?.replace('T', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge status={sch.scheduleStatus} />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNextFromStep2}
                >
                  Continue to Seat Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: SEAT SELECTION */}
        {currentStep === 3 && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <Armchair className="w-5 h-5 text-blue-600" />
                <span>Step 3: Select Coach Seat</span>
              </div>
            }
            subtitle="Click an available seat to assign to reservation"
          >
            <div className="space-y-4">
              {/* Filter tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Class:</span>
                {['ALL', ...coachClasses].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedCoachClass(cls)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedCoachClass === cls
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>

              {/* Seat grid */}
              <div className="max-h-72 overflow-y-auto p-1 border rounded-xl border-slate-100 bg-slate-50/50">
                {filteredSeats.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No seats available for this selection.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {filteredSeats.map((s) => {
                      const isSelected = selectedSeat?.seatId === s.seatId;
                      return (
                        <button
                          key={s.seatId}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setSelectedSeat(s)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600/30 shadow-sm'
                              : s.available
                              ? 'bg-white hover:border-blue-400 border-slate-200 text-slate-800'
                              : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span>{s.coachNumber}</span>
                            <span
                              className={`px-1 rounded ${
                                isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {s.coachClass}
                            </span>
                          </div>
                          <div className="text-center my-1">
                            <span className="text-base font-bold font-mono">
                              #{s.seatNumber}
                            </span>
                            <span className="text-[10px] block opacity-80 uppercase">
                              {s.berthType}
                            </span>
                          </div>
                          <div className="text-[9px] text-center font-bold">
                            {s.available ? 'AVAILABLE' : 'BOOKED'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedSeat && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm">
                  <div>
                    <span className="text-xs text-emerald-700 font-semibold uppercase">Selected Seat</span>
                    <p className="text-base font-bold text-emerald-950 font-mono">
                      Coach {selectedSeat.coachNumber} • Seat #{selectedSeat.seatNumber} ({selectedSeat.berthType})
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Class: {selectedSeat.coachClass} • Fare will be computed via <code>F_CALCULATE_FARE</code>
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNextFromStep3}
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4: PAYMENT */}
        {currentStep === 4 && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Step 4: Payment & Transaction Demo</span>
              </div>
            }
            subtitle="Simulate payment gateway outcome to test DB triggers & ACID procedures"
          >
            <div className="space-y-5">
              {/* Booking Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Journey Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Passenger:</span>
                    <span className="font-semibold text-slate-800">{activePassenger?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Train:</span>
                    <span className="font-semibold text-slate-800">
                      {activeSchedule?.trainName} (#{activeSchedule?.trainNumber})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Route:</span>
                    <span className="font-semibold text-slate-800">
                      {activeSource?.stationName} → {activeDest?.stationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Seat Assigned:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedSeat?.coachNumber} #{selectedSeat?.seatNumber} ({selectedSeat?.coachClass})
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Academic Demo: Simulated Payment Status */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Academic Simulation Control
                  </span>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  Choose the simulated payment outcome to verify <code>TRG_SYNC_RESERVATION_ON_PAYMENT</code> trigger behavior:
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { val: 'SUCCESS', label: 'SUCCESS (Booking confirmed)' },
                    { val: 'FAILED', label: 'FAILED (Booking stays PENDING)' },
                    { val: 'PENDING', label: 'PENDING (Awaiting settlement)' },
                  ].map((item) => (
                    <label
                      key={item.val}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="simulatedStatus"
                        value={item.val}
                        checked={simulatedStatus === item.val}
                        onChange={(e) => setSimulatedStatus(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  onClick={handleFinalBooking}
                >
                  Execute P_BOOK_TICKET & Pay
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 5: CONFIRMATION */}
        {currentStep === 5 && bookingResult && (
          <Card>
            <div className="text-center py-6">
              {bookingResult.bookingStatus === 'CONFIRMED' ? (
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              )}

              <h2 className="text-2xl font-bold text-slate-900">
                {bookingResult.bookingStatus === 'CONFIRMED'
                  ? 'Ticket Booked Successfully!'
                  : 'Reservation Created (Pending Payment)'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {bookingResult.message}
              </p>

              {/* Large PNR Card */}
              <div className="max-w-sm mx-auto my-6 p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg">
                <span className="text-[11px] uppercase tracking-widest text-blue-200 block font-semibold">
                  Your Passenger Name Record (PNR)
                </span>
                <span className="text-3xl font-extrabold font-mono tracking-wider block mt-1">
                  {bookingResult.pnr}
                </span>
                <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-xs text-blue-100">
                  <span>Fare: ₹{bookingResult.fareAmount}</span>
                  <Badge status={bookingResult.bookingStatus} size="sm" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Link to={`/pnr?pnr=${bookingResult.pnr}`}>
                  <Button variant="primary" leftIcon={<FileCheck2 className="w-4 h-4" />}>
                    View Reservation Details
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingResult(null);
                    setCurrentStep(1);
                  }}
                >
                  Book Another Ticket
                </Button>
                <Link to="/">
                  <Button variant="ghost">Return Home</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};
