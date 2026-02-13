import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ResidentsPage } from './pages/ResidentsPage';
import { VisitsPage } from './pages/VisitsPage';
import { ParkingPage } from './pages/ParkingPage';
import { AmenitiesPage } from './pages/AmenitiesPage';
import { StorePage } from './pages/StorePage';
import { ConfigPage } from './pages/ConfigPage';
import { LogbookPage } from './pages/LogbookPage';
import { PQRSPage } from './pages/PQRSPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { VotingPage } from './pages/VotingPage';
import { FinancePage } from './pages/FinancePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AccessTerminalPage } from './pages/AccessTerminalPage';
import { ReceptionPage } from './pages/ReceptionPage';
import { ResidentLayout } from './components/layout/ResidentLayout';
import { ResidentHomePage } from './pages/resident/ResidentHomePage';
import { ResidentVisitsPage } from './pages/resident/ResidentVisitsPage';
import { ResidentAmenitiesPage } from './pages/resident/ResidentAmenitiesPage';
import { ResidentPaymentsPage } from './pages/resident/ResidentPaymentsPage';
import { UnitsPage } from './pages/UnitsPage';

function App() {
  console.log('--- App Rendered ---');
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin', 'guard']}>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="residents" element={<ResidentsPage />} />
              <Route path="visits" element={<VisitsPage />} />
              <Route path="parking" element={<ParkingPage />} />
              <Route path="amenities" element={<AmenitiesPage />} />
              <Route path="store" element={<StorePage />} />
              <Route path="units" element={<UnitsPage />} />
              <Route path="config" element={<ConfigPage />} />
              <Route path="logbook" element={<LogbookPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="voting" element={<VotingPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="communications" element={<AnnouncementsPage />} />
              <Route path="super-admin" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminPage />
                </ProtectedRoute>
              } />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="pqrs" element={<PQRSPage />} />
              <Route path="access-terminal" element={<AccessTerminalPage />} />
              <Route path="reception" element={<ReceptionPage />} />
            </Route>

            {/* Resident Routes */}
            <Route path="/resident" element={
              <ProtectedRoute allowedRoles={['resident']}>
                <ResidentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ResidentHomePage />} />
              <Route path="visits" element={<ResidentVisitsPage />} />
              <Route path="amenities" element={<ResidentAmenitiesPage />} />
              <Route path="store" element={<div>Tienda (Pronto)</div>} />
              <Route path="payments" element={<ResidentPaymentsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
