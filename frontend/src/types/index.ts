export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface Station {
  stationId: number;
  stationCode: string;
  stationName: string;
  city: string;
  state: string;
}

export interface StationRequest {
  stationCode: string;
  stationName: string;
  city: string;
  state: string;
}

export interface Passenger {
  passengerId: number;
  fullName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O' | string;
  phone: string;
  email: string;
}

export interface PassengerRequest {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
}

export interface Train {
  trainId: number;
  trainNumber: string;
  trainName: string;
  trainType: string;
  activeStatus: string;
}

export interface TrainRequest {
  trainNumber: string;
  trainName: string;
  trainType: string;
  activeStatus?: string;
}

export interface TrainStop {
  trainId: number;
  stopSequence: number;
  stationId: number;
  stationName?: string;
  stationCode?: string;
  arrivalTime: string;
  departureTime: string;
  distanceFromOriginKm: number;
}

export interface TrainStopRequest {
  stopSequence: number;
  stationId: number;
  arrivalTime: string;
  departureTime: string;
  distanceFromOriginKm: number;
}

export interface TrainSchedule {
  scheduleId: number;
  trainId: number;
  trainNumber?: string;
  trainName?: string;
  journeyDate: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  scheduleStatus: string;
}

export interface ScheduleRequest {
  trainId: number;
  journeyDate: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  scheduleStatus?: string;
}

export interface Seat {
  seatId: number;
  trainId: number;
  coachNumber: string;
  seatNumber: number;
  coachClass: string;
  berthType: string;
}

export interface SeatRequest {
  trainId: number;
  coachNumber: string;
  seatNumber: number;
  coachClass: string;
  berthType: string;
}

export interface SeatAvailability {
  seatId: number;
  coachNumber: string;
  seatNumber: number;
  coachClass: string;
  berthType: string;
  available: boolean;
}

export interface TrainSearchResult {
  trainId: number;
  trainNumber: string;
  trainName: string;
  trainType: string;
  scheduleId: number;
  journeyDate: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  sourceDepartureTime: string;
  destArrivalTime: string;
  sourceStationId: number;
  sourceStationCode: string;
  sourceStationName: string;
  destinationStationId: number;
  destinationStationCode: string;
  destinationStationName: string;
  availableSeats: number;
}

export interface Reservation {
  reservationId: number;
  pnr: string;
  passengerId: number;
  scheduleId: number;
  seatId: number;
  sourceStationId: number;
  destinationStationId: number;
  bookingTimestamp: string;
  bookingStatus: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | string;
  fareAmount: number;
}

export interface Payment {
  paymentId: number;
  reservationId: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUND_SUCCESS' | string;
  transactionReference: string;
  paymentTimestamp: string;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface BookingRequest {
  passengerId: number;
  scheduleId: number;
  sourceStationId: number;
  destinationStationId: number;
  seatId: number;
  paymentMethod: string;
  simulatedPaymentStatus?: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
}

export interface BookingResponse {
  reservationId: number;
  pnr: string;
  fareAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  message: string;
}

export interface CancellationResponse {
  result: string;
  bookingStatus: string;
  refundAmount: number;
  transactionReference: string;
}

export interface ReservationDetails {
  reservationId: number;
  pnr: string;
  bookingTimestamp: string;
  bookingStatus: string;
  fareAmount: number;

  passengerId: number;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  passengerGender: string;
  passengerDob: string;

  trainId: number;
  trainNumber: string;
  trainName: string;
  trainType: string;

  scheduleId: number;
  journeyDate: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  scheduleStatus: string;

  seatId: number;
  coachNumber: string;
  seatNumber: number;
  coachClass: string;
  berthType: string;

  sourceStationId: number;
  sourceStationName: string;
  sourceStationCode: string;

  destinationStationId: number;
  destinationStationName: string;
  destinationStationCode: string;

  payments: Payment[];
}

export interface DashboardStats {
  totalPassengers: number;
  totalTrains: number;
  totalStations: number;
  totalReservations: number;
  confirmedCount: number;
  pendingCount: number;
  cancelledCount: number;
  totalRevenue: number;
  totalRefunds: number;
}

export interface RevenueReport {
  trainId: number;
  trainNumber: string;
  trainName: string;
  totalBookings: number;
  grossRevenue: number;
  totalRefunds: number;
  netRevenue: number;
}

export interface OccupancyReport {
  trainId: number;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  coachClass: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  occupancyPercentage: number;
}

export interface MonthlyBookingReport {
  bookingMonth: string;
  year: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

export interface PopularRouteReport {
  sourceStationId: number;
  sourceStationCode: string;
  sourceStationName: string;
  destinationStationId: number;
  destinationStationCode: string;
  destinationStationName: string;
  totalTrips: number;
  totalPassengers: number;
  totalRevenue: number;
}

export interface QueryResultResponse {
  queryId: string;
  description: string;
  executionTimeMs: number;
  columns: string[];
  rows: Record<string, any>[];
}
