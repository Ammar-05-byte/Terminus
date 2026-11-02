import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  bookTicket,
  cancelReservation,
  getAvailableSeatCount,
  expirePendingReservations,
  recordPayment,
  getReservationByPnr,
  getLabQueries,
  executeLabQuery,
  getPassengers,
  getSchedules,
  getStations,
  getSeats,
} from '../../services/api';
import type {
  BookingResponse,
  CancellationResponse,
  QueryResultResponse,
  Passenger,
  TrainSchedule,
  Station,
  Seat,
  ReservationDetails,
} from '../../types';
import {
  Terminal,
  Play,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Code,
} from 'lucide-react';

export const DatabaseLabPage: React.FC = () => {
  const { success, error } = useToast();
  const [activeSection, setActiveSection] = useState<
    'procedures' | 'functions' | 'cursors' | 'triggers' | 'queries'
  >('procedures');

  // Pre-loaded entities for easy demo dropdown selection
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [schedules, setSchedules] = useState<TrainSchedule[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  // 1. P_BOOK_TICKET state
  const [bookParams, setBookParams] = useState({
    passengerId: 1,
    scheduleId: 1,
    sourceStationId: 1,
    destStationId: 2,
    seatId: 1,
    paymentMethod: 'UPI',
    simulatedPaymentStatus: 'SUCCESS',
  });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookResult, setBookResult] = useState<BookingResponse | null>(null);

  // 2. P_CANCEL_RESERVATION state
  const [cancelPnr, setCancelPnr] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelResult, setCancelResult] = useState<CancellationResponse | null>(null);

  // 3. F_AVAILABLE_SEAT_COUNT state
  const [funcScheduleId, setFuncScheduleId] = useState(1);
  const [funcCoachClass, setFuncCoachClass] = useState('SL');
  const [funcLoading, setFuncLoading] = useState(false);
  const [funcResult, setFuncResult] = useState<number | null>(null);

  // 4. P_EXPIRE_STALE_RESERVATIONS state
  const [expireMinutes, setExpireMinutes] = useState(15);
  const [expireLoading, setExpireLoading] = useState(false);
  const [expireResult, setExpireResult] = useState<{ expiredCount: number } | null>(null);

  // 5. TRIGGER DEMONSTRATION state
  const [triggerPnr, setTriggerPnr] = useState('');
  const [triggerMethod, setTriggerMethod] = useState('UPI');
  const [triggerStatus, setTriggerStatus] = useState('SUCCESS');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [beforeDetails, setBeforeDetails] = useState<ReservationDetails | null>(null);
  const [afterDetails, setAfterDetails] = useState<ReservationDetails | null>(null);

  // 6. ACADEMIC QUERIES Q01-Q15 state
  const [queriesRegistry, setQueriesRegistry] = useState<Record<string, string>>({});
  const [selectedQueryId, setSelectedQueryId] = useState<string>('Q01');
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryResultResponse | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [passList, schList, statList, seatList, qList] = await Promise.all([
          getPassengers(),
          getSchedules(),
          getStations(),
          getSeats(),
          getLabQueries(),
        ]);
        setPassengers(passList);
        setSchedules(schList);
        setStations(statList);
        setSeats(seatList);
        setQueriesRegistry(qList);

        if (passList.length > 0) setBookParams((p) => ({ ...p, passengerId: passList[0].passengerId }));
        if (schList.length > 0) {
          setBookParams((p) => ({ ...p, scheduleId: schList[0].scheduleId }));
          setFuncScheduleId(schList[0].scheduleId);
        }
        if (statList.length >= 2) {
          setBookParams((p) => ({
            ...p,
            sourceStationId: statList[0].stationId,
            destStationId: statList[1].stationId,
          }));
        }
        if (seatList.length > 0) setBookParams((p) => ({ ...p, seatId: seatList[0].seatId }));
      } catch (err) {
        console.error('Failed to preload database entities', err);
      }
    };
    init();
  }, []);

  // Execute P_BOOK_TICKET
  const handleExecuteBook = async () => {
    setBookLoading(true);
    setBookResult(null);
    try {
      const res = await bookTicket({
        passengerId: Number(bookParams.passengerId),
        scheduleId: Number(bookParams.scheduleId),
        sourceStationId: Number(bookParams.sourceStationId),
        destinationStationId: Number(bookParams.destStationId),
        seatId: Number(bookParams.seatId),
        paymentMethod: bookParams.paymentMethod,
        simulatedPaymentStatus: bookParams.simulatedPaymentStatus,
      });
      setBookResult(res);
      setTriggerPnr(res.pnr);
      setCancelPnr(res.pnr);
      success(`Procedure P_BOOK_TICKET executed! PNR: ${res.pnr}`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error executing stored procedure');
    } finally {
      setBookLoading(false);
    }
  };

  // Execute P_CANCEL_RESERVATION
  const handleExecuteCancel = async () => {
    if (!cancelPnr.trim()) {
      error('Please enter a PNR code');
      return;
    }
    setCancelLoading(true);
    setCancelResult(null);
    try {
      const res = await cancelReservation(cancelPnr.trim().toUpperCase());
      setCancelResult(res);
      success(`Procedure P_CANCEL_RESERVATION executed!`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error executing cancellation procedure');
    } finally {
      setCancelLoading(false);
    }
  };

  // Execute F_AVAILABLE_SEAT_COUNT
  const handleExecuteFunc = async () => {
    setFuncLoading(true);
    setFuncResult(null);
    try {
      const res = await getAvailableSeatCount(funcScheduleId, funcCoachClass);
      setFuncResult(res.availableSeats);
      success(`Function F_AVAILABLE_SEAT_COUNT returned: ${res.availableSeats}`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error executing database function');
    } finally {
      setFuncLoading(false);
    }
  };

  // Execute P_EXPIRE_STALE_RESERVATIONS
  const handleExecuteExpire = async () => {
    setExpireLoading(true);
    setExpireResult(null);
    try {
      const res = await expirePendingReservations(expireMinutes);
      setExpireResult(res);
      success(`Cursor procedure executed: ${res.expiredCount} reservation(s) expired`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error executing cursor procedure');
    } finally {
      setExpireLoading(false);
    }
  };

  // Trigger Demo: Check Before -> Record Payment -> Check After
  const handleTriggerDemo = async () => {
    if (!triggerPnr.trim()) {
      error('Please enter a PNR to test trigger reactive execution');
      return;
    }
    setTriggerLoading(true);
    try {
      // Step A: Fetch before state
      const before = await getReservationByPnr(triggerPnr.trim().toUpperCase());
      setBeforeDetails(before);

      // Step B: Record payment
      await recordPayment(triggerPnr.trim().toUpperCase(), {
        amount: before.fareAmount,
        paymentMethod: triggerMethod,
        paymentStatus: triggerStatus,
      });

      // Step C: Fetch after state
      const after = await getReservationByPnr(triggerPnr.trim().toUpperCase());
      setAfterDetails(after);

      success('Payment recorded! Observe the trigger updating bookingStatus automatically.');
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error in trigger demonstration');
    } finally {
      setTriggerLoading(false);
    }
  };

  // Execute Predefined Lab Query
  const handleExecuteQuery = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await executeLabQuery(selectedQueryId);
      setQueryResult(res);
      success(`Query ${selectedQueryId} executed in ${res.executionTimeMs}ms`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Error executing query');
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Database Operations Lab</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              DBMS Viva Demo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Interactive console for executing PL/SQL Stored Procedures, Functions, Triggers, Cursors & Complex SQL Queries
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'procedures', label: 'Stored Procedures', icon: <Terminal className="w-4 h-4" /> },
            { id: 'functions', label: 'PL/SQL Functions', icon: <Zap className="w-4 h-4" /> },
            { id: 'cursors', label: 'Cursor Maintenance', icon: <Clock className="w-4 h-4" /> },
            { id: 'triggers', label: 'Trigger Demonstration', icon: <Layers className="w-4 h-4" /> },
            { id: 'queries', label: 'Academic Queries (Q01-Q15)', icon: <Code className="w-4 h-4" /> },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === sec.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* 1. STORED PROCEDURES */}
        {activeSection === 'procedures' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* P_BOOK_TICKET */}
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-mono text-sm font-bold">PROCEDURE</span>
                    <span className="font-mono text-sm font-bold">P_BOOK_TICKET</span>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-semibold">
                    ACID Transaction
                  </span>
                </div>
              }
              subtitle="Executes atomic ticket booking, seat reservation, fare calculation, and payment entry"
            >
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Passenger ID</label>
                    <select
                      value={bookParams.passengerId}
                      onChange={(e) => setBookParams({ ...bookParams, passengerId: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {passengers.map((p) => (
                        <option key={p.passengerId} value={p.passengerId}>
                          #{p.passengerId} - {p.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Schedule ID</label>
                    <select
                      value={bookParams.scheduleId}
                      onChange={(e) => setBookParams({ ...bookParams, scheduleId: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {schedules.map((s) => (
                        <option key={s.scheduleId} value={s.scheduleId}>
                          #{s.scheduleId} - {s.trainName} ({s.journeyDate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Source Station</label>
                    <select
                      value={bookParams.sourceStationId}
                      onChange={(e) => setBookParams({ ...bookParams, sourceStationId: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {stations.map((s) => (
                        <option key={s.stationId} value={s.stationId}>
                          {s.stationCode} - {s.stationName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Destination Station</label>
                    <select
                      value={bookParams.destStationId}
                      onChange={(e) => setBookParams({ ...bookParams, destStationId: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {stations.map((s) => (
                        <option key={s.stationId} value={s.stationId}>
                          {s.stationCode} - {s.stationName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Seat ID</label>
                    <select
                      value={bookParams.seatId}
                      onChange={(e) => setBookParams({ ...bookParams, seatId: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {seats.map((st) => (
                        <option key={st.seatId} value={st.seatId}>
                          #{st.seatId} - {st.coachNumber} / {st.seatNumber} ({st.coachClass})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                    <select
                      value={bookParams.paymentMethod}
                      onChange={(e) => setBookParams({ ...bookParams, paymentMethod: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="UPI">UPI</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="NET_BANKING">Net Banking</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Simulated Gateway Status</label>
                  <select
                    value={bookParams.simulatedPaymentStatus}
                    onChange={(e) => setBookParams({ ...bookParams, simulatedPaymentStatus: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="SUCCESS">SUCCESS (Reservation confirmed)</option>
                    <option value="FAILED">FAILED (Reservation stays PENDING)</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    leftIcon={<Play className="w-4 h-4" />}
                    isLoading={bookLoading}
                    onClick={handleExecuteBook}
                  >
                    Execute P_BOOK_TICKET
                  </Button>
                </div>

                {bookResult && (
                  <div className="mt-4 p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto">
                    <p className="text-white font-bold">// OUT Parameters from CallableStatement:</p>
                    <p>p_pnr: "{bookResult.pnr}"</p>
                    <p>p_fare: ₹{bookResult.fareAmount}</p>
                    <p>p_booking_status: "{bookResult.bookingStatus}"</p>
                    <p>p_payment_status: "{bookResult.paymentStatus}"</p>
                    <p className="text-slate-400">// Message: {bookResult.message}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* P_CANCEL_RESERVATION */}
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-mono text-sm font-bold">PROCEDURE</span>
                    <span className="font-mono text-sm font-bold">P_CANCEL_RESERVATION</span>
                  </div>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-mono font-semibold">
                    Refund & Seat Release
                  </span>
                </div>
              }
              subtitle="Releases booked seat in real-time, calculates cancellation penalty/refund, and records refund txn"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Reservation PNR Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PNR20261101"
                    value={cancelPnr}
                    onChange={(e) => setCancelPnr(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm uppercase"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                  <strong>PL/SQL Logic:</strong> Validates booking exists and is not already CANCELLED. Updates reservation status to <code>CANCELLED</code>, generates a unique refund transaction reference in <code>PAYMENT</code> with status <code>REFUND_SUCCESS</code>, and immediately unblocks the seat.
                </div>

                <div className="pt-2">
                  <Button
                    variant="danger"
                    size="md"
                    className="w-full"
                    leftIcon={<Play className="w-4 h-4" />}
                    isLoading={cancelLoading}
                    onClick={handleExecuteCancel}
                  >
                    Execute P_CANCEL_RESERVATION
                  </Button>
                </div>

                {cancelResult && (
                  <div className="mt-4 p-4 bg-slate-900 text-rose-400 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto">
                    <p className="text-white font-bold">// OUT Parameters from CallableStatement:</p>
                    <p>p_result: "{cancelResult.result}"</p>
                    <p>p_booking_status: "{cancelResult.bookingStatus}"</p>
                    <p>p_refund_amount: ₹{cancelResult.refundAmount}</p>
                    <p>p_refund_txn: "{cancelResult.transactionReference}"</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 2. PL/SQL FUNCTIONS */}
        {activeSection === 'functions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* F_AVAILABLE_SEAT_COUNT */}
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-mono text-sm font-bold">FUNCTION</span>
                    <span className="font-mono text-sm font-bold">F_AVAILABLE_SEAT_COUNT</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-semibold">
                    RETURN NUMBER
                  </span>
                </div>
              }
              subtitle="Counts real-time unbooked seats for a given schedule and coach class"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Select Train Schedule
                  </label>
                  <select
                    value={funcScheduleId}
                    onChange={(e) => setFuncScheduleId(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {schedules.map((s) => (
                      <option key={s.scheduleId} value={s.scheduleId}>
                        Schedule #{s.scheduleId} - {s.trainName} ({s.journeyDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Coach Class Filter
                  </label>
                  <select
                    value={funcCoachClass}
                    onChange={(e) => setFuncCoachClass(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="SL">SL (Sleeper)</option>
                    <option value="3A">3A (AC 3 Tier)</option>
                    <option value="2A">2A (AC 2 Tier)</option>
                    <option value="1A">1A (AC First Class)</option>
                    <option value="CC">CC (Chair Car)</option>
                    <option value="2S">2S (Second Sitting)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    variant="success"
                    size="md"
                    className="w-full"
                    leftIcon={<Play className="w-4 h-4" />}
                    isLoading={funcLoading}
                    onClick={handleExecuteFunc}
                  >
                    Execute F_AVAILABLE_SEAT_COUNT
                  </Button>
                </div>

                {funcResult !== null && (
                  <div className="mt-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-xs text-emerald-700 font-semibold uppercase block">
                      Returned Value
                    </span>
                    <span className="text-4xl font-extrabold font-mono text-emerald-900 block my-1">
                      {funcResult}
                    </span>
                    <span className="text-xs text-emerald-700">
                      Seats currently available in {funcCoachClass} class
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* F_CALCULATE_FARE Info Card */}
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-mono text-sm font-bold">FUNCTION</span>
                    <span className="font-mono text-sm font-bold">F_CALCULATE_FARE</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-semibold">
                    RETURN NUMBER(10,2)
                  </span>
                </div>
              }
              subtitle="Computes distance * rate factor + class surcharge + train type surcharge"
            >
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                <p className="font-mono text-slate-800 font-bold">
                  FUNCTION F_CALCULATE_FARE(p_train_id, p_src_station, p_dest_station, p_coach_class)
                </p>
                <div className="text-slate-600 space-y-1">
                  <p>1. Computes delta distance: <code>ABS(dist(dest) - dist(src))</code></p>
                  <p>2. Applies class multiplier (1A: 3.5x, 2A: 2.5x, 3A: 1.8x, SL: 1.0x)</p>
                  <p>3. Incorporates train category supplement (Rajdhani / Shatabdi)</p>
                  <p>4. Automatically invoked inside <code>P_BOOK_TICKET</code> before inserting into <code>RESERVATION</code></p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 3. CURSOR MAINTENANCE */}
        {activeSection === 'cursors' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-mono text-sm font-bold">CURSOR</span>
                    <span className="font-mono text-sm font-bold">P_EXPIRE_STALE_RESERVATIONS</span>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono font-semibold">
                    Explicit Cursor FOR UPDATE
                  </span>
                </div>
              }
              subtitle="Scans unconfirmed reservations using an explicit cursor and marks them EXPIRED"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Max Pending Age (Minutes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={expireMinutes}
                    onChange={(e) => setExpireMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Reservations older than this age with status 'PENDING' will be fetched by the cursor.
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] font-mono leading-relaxed">
                  CURSOR c_stale IS<br />
                  &nbsp;&nbsp;SELECT reservation_id, pnr, booking_timestamp<br />
                  &nbsp;&nbsp;FROM RESERVATION<br />
                  &nbsp;&nbsp;WHERE booking_status = 'PENDING'<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;AND booking_timestamp &lt; SYSTIMESTAMP - NUMTODSINTERVAL(p_max_age_minutes, 'MINUTE')<br />
                  &nbsp;&nbsp;FOR UPDATE OF booking_status;
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    leftIcon={<Play className="w-4 h-4" />}
                    isLoading={expireLoading}
                    onClick={handleExecuteExpire}
                  >
                    Execute Cursor Expiration
                  </Button>
                </div>

                {expireResult && (
                  <div className="mt-4 p-5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-xs text-amber-800 font-semibold uppercase block">
                      Cursor Scan Complete
                    </span>
                    <span className="text-4xl font-extrabold font-mono text-amber-900 block my-1">
                      {expireResult.expiredCount}
                    </span>
                    <span className="text-xs text-amber-700">
                      Stale pending reservation(s) expired & seats recycled
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 4. TRIGGER DEMONSTRATION */}
        {activeSection === 'triggers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Explanation Card */}
              <Card
                title="Database Triggers Overview"
                subtitle="Event-driven integrity enforcement and reactive state synchronization"
              >
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="font-bold font-mono text-blue-900 block">
                      1. TRG_VALIDATE_RESERVATION (BEFORE INSERT)
                    </span>
                    <p className="mt-1 text-slate-600">
                      Enforces that the chosen seat is available on the scheduled journey date. If another active booking exists on the same schedule and seat, the trigger raises application error <code>ORA-20001: Seat already reserved</code>.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="font-bold font-mono text-emerald-900 block">
                      2. TRG_SYNC_RESERVATION_ON_PAYMENT (AFTER INSERT ON PAYMENT)
                    </span>
                    <p className="mt-1 text-slate-600">
                      When a new payment record is inserted into <code>PAYMENT</code> with <code>payment_status = 'SUCCESS'</code>, this trigger automatically updates the parent reservation's <code>booking_status</code> from <code>PENDING</code> to <code>CONFIRMED</code>.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Interactive Demo Runner */}
              <Card
                title="Interactive Trigger Test: TRG_SYNC_RESERVATION_ON_PAYMENT"
                subtitle="Record payment and inspect automatic status promotion"
              >
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Target PNR (Preferably PENDING) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PNR20261101"
                      value={triggerPnr}
                      onChange={(e) => setTriggerPnr(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                      <select
                        value={triggerMethod}
                        onChange={(e) => setTriggerMethod(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="UPI">UPI</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Payment Status</label>
                      <select
                        value={triggerStatus}
                        onChange={(e) => setTriggerStatus(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="SUCCESS">SUCCESS (Triggers CONFIRMED)</option>
                        <option value="FAILED">FAILED (No status change)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      leftIcon={<Zap className="w-4 h-4" />}
                      isLoading={triggerLoading}
                      onClick={handleTriggerDemo}
                    >
                      Record Payment & Observe Trigger
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Before / After Comparison */}
            {beforeDetails && afterDetails && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Trigger Execution Audit Comparison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block">
                      Before Payment Insert
                    </span>
                    <p>PNR: <span className="font-mono font-bold">{beforeDetails.pnr}</span></p>
                    <p>
                      Booking Status:{' '}
                      <Badge status={beforeDetails.bookingStatus} size="sm" />
                    </p>
                    <p>Payments Count: <span className="font-bold">{beforeDetails.payments?.length || 0}</span></p>
                  </div>

                  {/* After */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider block">
                      After Payment Insert (Reactive Trigger Fired)
                    </span>
                    <p>PNR: <span className="font-mono font-bold">{afterDetails.pnr}</span></p>
                    <p>
                      Booking Status:{' '}
                      <Badge status={afterDetails.bookingStatus} size="sm" />
                    </p>
                    <p>Payments Count: <span className="font-bold">{afterDetails.payments?.length || 0}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. ACADEMIC SQL QUERIES (Q01 - Q15) */}
        {activeSection === 'queries' && (
          <div className="space-y-6">
            <Card
              title="Academic Query Execution Registry (Q01 - Q15)"
              subtitle="Execute designated SQL queries and measure query performance in milliseconds"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Select Predefined Lab Query
                  </label>
                  <select
                    value={selectedQueryId}
                    onChange={(e) => setSelectedQueryId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-sm"
                  >
                    {Object.entries(queriesRegistry).map(([id, desc]) => (
                      <option key={id} value={id}>
                        {id}: {desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-slate-500">
                    Query: <span className="font-bold text-slate-800">{selectedQueryId}</span> •{' '}
                    {queriesRegistry[selectedQueryId]}
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Play className="w-4 h-4" />}
                    isLoading={queryLoading}
                    onClick={handleExecuteQuery}
                  >
                    Execute Query
                  </Button>
                </div>
              </div>
            </Card>

            {/* Query Output Display */}
            {queryResult && (
              <Card
                title={
                  <div className="flex items-center justify-between w-full">
                    <span>Query Output: {queryResult.queryId}</span>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      Elapsed Time: {queryResult.executionTimeMs} ms
                    </span>
                  </div>
                }
                subtitle={`${queryResult.rows?.length || 0} row(s) returned`}
              >
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                    <thead className="bg-slate-50 font-semibold text-slate-700 sticky top-0">
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th key={col} className="px-3 py-2.5 uppercase font-mono tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {queryResult.columns.map((col) => (
                            <td key={col} className="px-3 py-2 text-slate-800 font-mono whitespace-nowrap">
                              {row[col] !== undefined && row[col] !== null ? String(row[col]) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
