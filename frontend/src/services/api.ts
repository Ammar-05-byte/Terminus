import axios from 'axios';
import type {
  Station,
  StationRequest,
  Passenger,
  PassengerRequest,
  Train,
  TrainRequest,
  TrainStop,
  TrainStopRequest,
  TrainSchedule,
  ScheduleRequest,
  Seat,
  SeatRequest,
  SeatAvailability,
  TrainSearchResult,
  Reservation,
  Payment,
  PaymentRequest,
  BookingRequest,
  BookingResponse,
  CancellationResponse,
  ReservationDetails,
  DashboardStats,
  RevenueReport,
  OccupancyReport,
  MonthlyBookingReport,
  PopularRouteReport,
  QueryResultResponse,
  ApiResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract data from backend ApiResponse envelope
const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> => {
  const res = await promise;
  if (res.data && res.data.success !== undefined) {
    return res.data.data;
  }
  return (res.data as unknown) as T;
};

// ================= STATIONS =================
export const getStations = async (): Promise<Station[]> => {
  return unwrap(api.get<ApiResponse<Station[]>>('/stations'));
};

export const getStation = async (id: number): Promise<Station> => {
  return unwrap(api.get<ApiResponse<Station>>(`/stations/${id}`));
};

export const getStationByCode = async (code: string): Promise<Station> => {
  return unwrap(api.get<ApiResponse<Station>>(`/stations/code/${code}`));
};

export const createStation = async (data: StationRequest): Promise<Station> => {
  return unwrap(api.post<ApiResponse<Station>>('/stations', data));
};

export const updateStation = async (id: number, data: StationRequest): Promise<Station> => {
  return unwrap(api.put<ApiResponse<Station>>(`/stations/${id}`, data));
};

export const deleteStation = async (id: number): Promise<void> => {
  await api.delete(`/stations/${id}`);
};

// ================= PASSENGERS =================
export const getPassengers = async (): Promise<Passenger[]> => {
  return unwrap(api.get<ApiResponse<Passenger[]>>('/passengers'));
};

export const getPassenger = async (id: number): Promise<Passenger> => {
  return unwrap(api.get<ApiResponse<Passenger>>(`/passengers/${id}`));
};

export const createPassenger = async (data: PassengerRequest): Promise<Passenger> => {
  return unwrap(api.post<ApiResponse<Passenger>>('/passengers', data));
};

export const updatePassenger = async (id: number, data: PassengerRequest): Promise<Passenger> => {
  return unwrap(api.put<ApiResponse<Passenger>>(`/passengers/${id}`, data));
};

export const deletePassenger = async (id: number): Promise<void> => {
  await api.delete(`/passengers/${id}`);
};

export const getPassengerReservations = async (passengerId: number): Promise<ReservationDetails[]> => {
  return unwrap(api.get<ApiResponse<ReservationDetails[]>>(`/passengers/${passengerId}/reservations`));
};

// ================= TRAINS =================
export const getTrains = async (): Promise<Train[]> => {
  return unwrap(api.get<ApiResponse<Train[]>>('/trains'));
};

export const getTrain = async (id: number): Promise<Train> => {
  return unwrap(api.get<ApiResponse<Train>>(`/trains/${id}`));
};

export const searchTrains = async (
  sourceStationId: number,
  destStationId: number,
  journeyDate: string
): Promise<TrainSearchResult[]> => {
  return unwrap(
    api.get<ApiResponse<TrainSearchResult[]>>('/trains/search', {
      params: { sourceStationId, destStationId, journeyDate },
    })
  );
};

export const getTrainRoute = async (trainId: number): Promise<TrainStop[]> => {
  return unwrap(api.get<ApiResponse<TrainStop[]>>(`/trains/${trainId}/route`));
};

export const createTrain = async (data: TrainRequest): Promise<Train> => {
  return unwrap(api.post<ApiResponse<Train>>('/trains', data));
};

export const updateTrain = async (id: number, data: TrainRequest): Promise<Train> => {
  return unwrap(api.put<ApiResponse<Train>>(`/trains/${id}`, data));
};

export const deleteTrain = async (id: number): Promise<void> => {
  await api.delete(`/trains/${id}`);
};

export const addTrainStop = async (trainId: number, data: TrainStopRequest): Promise<TrainStop> => {
  return unwrap(api.post<ApiResponse<TrainStop>>(`/trains/${trainId}/stops`, data));
};

// ================= SCHEDULES =================
export const getSchedules = async (): Promise<TrainSchedule[]> => {
  return unwrap(api.get<ApiResponse<TrainSchedule[]>>('/schedules'));
};

export const getSchedule = async (id: number): Promise<TrainSchedule> => {
  return unwrap(api.get<ApiResponse<TrainSchedule>>(`/schedules/${id}`));
};

export const getScheduleSeats = async (scheduleId: number): Promise<SeatAvailability[]> => {
  return unwrap(api.get<ApiResponse<SeatAvailability[]>>(`/schedules/${scheduleId}/seats`));
};

export const getUpcomingFromStation = async (stationId: number): Promise<TrainSchedule[]> => {
  return unwrap(api.get<ApiResponse<TrainSchedule[]>>(`/schedules/station/${stationId}`));
};

export const createSchedule = async (data: ScheduleRequest): Promise<TrainSchedule> => {
  return unwrap(api.post<ApiResponse<TrainSchedule>>('/schedules', data));
};

export const updateSchedule = async (id: number, data: ScheduleRequest): Promise<TrainSchedule> => {
  return unwrap(api.put<ApiResponse<TrainSchedule>>(`/schedules/${id}`, data));
};

export const deleteSchedule = async (id: number): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};

// ================= SEATS =================
export const getSeats = async (): Promise<Seat[]> => {
  return unwrap(api.get<ApiResponse<Seat[]>>('/seats'));
};

export const getSeat = async (id: number): Promise<Seat> => {
  return unwrap(api.get<ApiResponse<Seat>>(`/seats/${id}`));
};

export const getSeatsByTrain = async (trainId: number): Promise<Seat[]> => {
  return unwrap(api.get<ApiResponse<Seat[]>>(`/seats/train/${trainId}`));
};

export const getAvailableSeats = async (
  scheduleId: number,
  coachClass?: string
): Promise<Seat[]> => {
  return unwrap(
    api.get<ApiResponse<Seat[]>>('/seats/available', {
      params: { scheduleId, coachClass },
    })
  );
};

export const createSeat = async (data: SeatRequest): Promise<Seat> => {
  return unwrap(api.post<ApiResponse<Seat>>('/seats', data));
};

export const updateSeat = async (id: number, data: SeatRequest): Promise<Seat> => {
  return unwrap(api.put<ApiResponse<Seat>>(`/seats/${id}`, data));
};

export const deleteSeat = async (id: number): Promise<void> => {
  await api.delete(`/seats/${id}`);
};

// ================= RESERVATIONS =================
export const getAllReservations = async (): Promise<Reservation[]> => {
  return unwrap(api.get<ApiResponse<Reservation[]>>('/reservations'));
};

export const bookTicket = async (data: BookingRequest): Promise<BookingResponse> => {
  return unwrap(api.post<ApiResponse<BookingResponse>>('/reservations', data));
};

export const getReservationByPnr = async (pnr: string): Promise<ReservationDetails> => {
  return unwrap(api.get<ApiResponse<ReservationDetails>>(`/reservations/pnr/${pnr}`));
};

export const cancelReservation = async (pnr: string): Promise<CancellationResponse> => {
  return unwrap(api.post<ApiResponse<CancellationResponse>>(`/reservations/${pnr}/cancel`));
};

// ================= PAYMENTS =================
export const getAllPayments = async (): Promise<Payment[]> => {
  return unwrap(api.get<ApiResponse<Payment[]>>('/payments'));
};

export const recordPayment = async (pnr: string, data: PaymentRequest): Promise<Payment> => {
  return unwrap(api.post<ApiResponse<Payment>>(`/reservations/${pnr}/payments`, data));
};

export const getPaymentHistory = async (pnr: string): Promise<Payment[]> => {
  return unwrap(api.get<ApiResponse<Payment[]>>(`/reservations/${pnr}/payments`));
};

// ================= REPORTS =================
export const getDashboard = async (): Promise<DashboardStats> => {
  return unwrap(api.get<ApiResponse<DashboardStats>>('/reports/dashboard'));
};

export const getRevenue = async (): Promise<RevenueReport[]> => {
  return unwrap(api.get<ApiResponse<RevenueReport[]>>('/reports/revenue'));
};

export const getOccupancy = async (): Promise<OccupancyReport[]> => {
  return unwrap(api.get<ApiResponse<OccupancyReport[]>>('/reports/occupancy'));
};

export const getMonthlyBookings = async (): Promise<MonthlyBookingReport[]> => {
  return unwrap(api.get<ApiResponse<MonthlyBookingReport[]>>('/reports/monthly-bookings'));
};

export const getPopularRoutes = async (): Promise<PopularRouteReport[]> => {
  return unwrap(api.get<ApiResponse<PopularRouteReport[]>>('/reports/popular-routes'));
};

// ================= ADMIN / DATABASE LAB =================
export const expirePendingReservations = async (
  maxAgeMinutes: number = 15
): Promise<{ expiredCount: number; maxAgeMinutes: number }> => {
  return unwrap(
    api.post<ApiResponse<{ expiredCount: number; maxAgeMinutes: number }>>(
      '/admin/database/expire-pending-reservations',
      { maxAgeMinutes }
    )
  );
};

export const getAvailableSeatCount = async (
  scheduleId: number,
  coachClass: string = 'SL'
): Promise<{ scheduleId: number; coachClass: string; availableSeats: number }> => {
  return unwrap(
    api.get<ApiResponse<{ scheduleId: number; coachClass: string; availableSeats: number }>>(
      '/admin/database/available-seats',
      { params: { scheduleId, coachClass } }
    )
  );
};

export const getLabQueries = async (): Promise<Record<string, string>> => {
  return unwrap(api.get<ApiResponse<Record<string, string>>>('/admin/database/queries'));
};

export const executeLabQuery = async (queryId: string): Promise<QueryResultResponse> => {
  return unwrap(
    api.post<ApiResponse<QueryResultResponse>>('/admin/database/queries/execute', { queryId })
  );
};

export default api;
