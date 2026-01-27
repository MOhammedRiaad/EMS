import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TenantOnboarding from './pages/onboarding/TenantOnboarding';
import Clients from './pages/clients/Clients';
import ClientDetailsPage from './pages/clients/ClientDetailsPage';
import Coaches from './pages/coaches/Coaches';
import CreateCoach from './pages/coaches/CreateCoach';
import Sessions from './pages/sessions/Sessions';
import SessionCreatePage from './pages/sessions/SessionCreatePage';
import Studios from './pages/studios/Studios';
import Rooms from './pages/rooms/Rooms';
import Devices from './pages/devices/Devices';
import InBodyScans from './pages/inbody/InBodyScans';
import InBodyScanForm from './pages/inbody/InBodyScanForm';
import UserManagement from './pages/admin/UserManagement';
import CoachPerformance from './pages/admin/CoachPerformance';
import AdminWaitingList from './pages/admin/AdminWaitingList';
import AdminPackages from './pages/admin/AdminPackages';
import AdminCashFlow from './pages/admin/AdminCashFlow';
import AdminSettings from './pages/admin/AdminSettings';
import Analytics from './pages/admin/Analytics';
import Reviews from './pages/admin/Reviews';
import ProductListPage from './pages/admin/retail/ProductListPage';
import InventoryPage from './pages/admin/retail/InventoryPage';
import POSPage from './pages/admin/retail/POSPage';
import RetailReportsPage from './pages/admin/retail/RetailReportsPage';
import BrandSettings from './pages/admin/BrandSettings';
import { AuthProvider } from './contexts/AuthContext';
import { MenuPreferencesProvider } from './contexts/MenuPreferencesContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles/variables.css';
import SetupPassword from './pages/auth/SetupPassword';
import ClientLayout from './components/layout/ClientLayout';
import ClientHome from './pages/client/ClientHome';

import ClientSchedule from './pages/client/ClientSchedule';
import ClientProfile from './pages/client/ClientProfile';
import ClientBooking from './pages/client/ClientBooking';
import ClientProgress from './pages/client/ClientProgress';
import NotificationPreferences from './pages/client/NotificationPreferences';
import PrivacySettings from './pages/client/PrivacySettings';
import HelpSupport from './pages/client/HelpSupport';
import { LeaderboardPage } from './pages/client/LeaderboardPage';
import RoleGuard from './components/auth/RoleGuard';

import CoachLayout from './components/layout/CoachLayout';
import CoachHome from './pages/coach/CoachHome';
import CoachClients from './pages/coach/CoachClients';
import CoachClientDetails from './pages/coach/CoachClientDetails';
import CoachAvailability from './pages/coach/CoachAvailability';

function App() {
  return (
    <ThemeProvider>
      <MenuPreferencesProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<TenantOnboarding />} />
              <Route path="/auth/setup" element={<SetupPassword />} />

              {/* Client Portal Routes */}
              <Route element={<RoleGuard allowedRoles={['client']} />}>
                <Route path="/client" element={<ClientLayout />}>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<ClientHome />} />
                  <Route path="schedule" element={<ClientSchedule />} />
                  <Route path="book" element={<ClientBooking />} />
                  <Route path="progress" element={<ClientProgress />} />
                  <Route path="profile" element={<ClientProfile />} />
                  <Route path="notifications" element={<NotificationPreferences />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="privacy" element={<PrivacySettings />} />
                  <Route path="help" element={<HelpSupport />} />
                </Route>
              </Route>

              {/* Coach Portal Routes */}
              <Route element={<RoleGuard allowedRoles={['coach']} />}>
                <Route path="/coach" element={<CoachLayout />}>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<CoachHome />} />
                  <Route path="clients" element={<CoachClients />} />
                  <Route path="clients/:id" element={<CoachClientDetails />} />
                  <Route path="availability" element={<CoachAvailability />} />
                  <Route path="inbody/new/:clientId" element={<InBodyScanForm />} />
                </Route>
              </Route>

              {/* Admin / Studio Routes */}
              <Route element={<RoleGuard allowedRoles={['admin', 'tenant_owner']} />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="sessions" element={<Sessions />} />
                  <Route path="sessions/new" element={<SessionCreatePage />} />
                  <Route path="sessions/:id/edit" element={<SessionCreatePage />} />

                  <Route path="clients" element={<Clients />} />
                  <Route path="clients/:id" element={<ClientDetailsPage />} />
                  <Route path="coaches" element={<Coaches />} />
                  <Route path="coaches/create" element={<CreateCoach />} />

                  <Route path="retail/products" element={<ProductListPage />} />
                  <Route path="retail/inventory" element={<InventoryPage />} />
                  <Route path="retail/pos" element={<POSPage />} />
                  <Route path="retail/reports" element={<RetailReportsPage />} />

                  <Route path="studios" element={<Studios />} />
                  <Route path="rooms" element={<Rooms />} />
                  <Route path="devices" element={<Devices />} />

                  <Route path="inbody" element={<InBodyScans />} />
                  <Route path="inbody/new" element={<InBodyScanForm />} />
                  <Route path="inbody/edit/:scanId" element={<InBodyScanForm />} />

                  <Route path="admin/users" element={<UserManagement />} />
                  <Route path="admin/coach-performance" element={<CoachPerformance />} />
                  <Route path="admin/waiting-list" element={<AdminWaitingList />} />
                  <Route path="admin/reviews" element={<Reviews />} />
                  <Route path="admin/packages" element={<AdminPackages />} />
                  <Route path="admin/cash-flow" element={<AdminCashFlow />} />
                  <Route path="admin/settings" element={<AdminSettings />} />
                  <Route path="admin/branding" element={<BrandSettings />} />
                  <Route path="analytics" element={<Analytics />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </MenuPreferencesProvider>
    </ThemeProvider>
  );
}

export default App;
