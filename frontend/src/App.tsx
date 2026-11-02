import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';

// Pages
import { HomePage } from './pages/HomePage';
import { TrainSearchPage } from './pages/TrainSearchPage';
import { TrainDetailsPage } from './pages/TrainDetailsPage';
import { SeatAvailabilityPage } from './pages/SeatAvailabilityPage';
import { BookingPage } from './pages/BookingPage';
import { PnrStatusPage } from './pages/PnrStatusPage';
import { CancellationPage } from './pages/CancellationPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { PassengerDashboardPage } from './pages/PassengerDashboardPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPassengersPage } from './pages/admin/AdminPassengersPage';
import { AdminStationsPage } from './pages/admin/AdminStationsPage';
import { AdminTrainsPage } from './pages/admin/AdminTrainsPage';
import { AdminRoutesPage } from './pages/admin/AdminRoutesPage';
import { AdminSchedulesPage } from './pages/admin/AdminSchedulesPage';
import { AdminSeatsPage } from './pages/admin/AdminSeatsPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { DatabaseLabPage } from './pages/admin/DatabaseLabPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Traveler Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<TrainSearchPage />} />
          <Route path="/trains/:trainId" element={<TrainDetailsPage />} />
          <Route path="/seats/:scheduleId" element={<SeatAvailabilityPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/pnr" element={<PnrStatusPage />} />
          <Route path="/cancel" element={<CancellationPage />} />
          <Route path="/payments" element={<PaymentHistoryPage />} />
          <Route path="/dashboard" element={<PassengerDashboardPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/passengers" element={<AdminPassengersPage />} />
          <Route path="/admin/stations" element={<AdminStationsPage />} />
          <Route path="/admin/trains" element={<AdminTrainsPage />} />
          <Route path="/admin/routes" element={<AdminRoutesPage />} />
          <Route path="/admin/schedules" element={<AdminSchedulesPage />} />
          <Route path="/admin/seats" element={<AdminSeatsPage />} />
          <Route path="/admin/reservations" element={<AdminReservationsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/database-lab" element={<DatabaseLabPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
