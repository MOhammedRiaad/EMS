import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TenantOnboarding from './pages/onboarding/TenantOnboarding';
import Clients from './pages/clients/Clients';
import Coaches from './pages/coaches/Coaches';
import Sessions from './pages/sessions/Sessions';
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
import { AuthProvider } from './contexts/AuthContext';
import './styles/variables.css';
import SetupPassword from './pages/auth/SetupPassword';
import ClientLayout from './components/layout/ClientLayout';
import ClientHome from './pages/client/ClientHome';

import ClientSchedule from './pages/client/ClientSchedule';
import ClientProfile from './pages/client/ClientProfile';
import ClientBooking from './pages/client/ClientBooking';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<TenantOnboarding />} />
          <Route path="/auth/setup" element={<SetupPassword />} />

          {/* Client Portal Routes */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<ClientHome />} />
            <Route path="schedule" element={<ClientSchedule />} />
            <Route path="book" element={<ClientBooking />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Admin / Studio Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />

            <Route path="clients" element={<Clients />} />
            <Route path="coaches" element={<Coaches />} />

            <Route path="studios" element={<Studios />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="devices" element={<Devices />} />

            <Route path="inbody" element={<InBodyScans />} />
            <Route path="inbody/new" element={<InBodyScanForm />} />
            <Route path="inbody/edit/:scanId" element={<InBodyScanForm />} />

            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/coach-performance" element={<CoachPerformance />} />
            <Route path="admin/waiting-list" element={<AdminWaitingList />} />
            <Route path="admin/packages" element={<AdminPackages />} />
            <Route path="admin/cash-flow" element={<AdminCashFlow />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
