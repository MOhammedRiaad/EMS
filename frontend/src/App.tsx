import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Clients from './pages/clients/Clients';
import Coaches from './pages/coaches/Coaches';
import Sessions from './pages/sessions/Sessions';
import Studios from './pages/studios/Studios';
import Rooms from './pages/rooms/Rooms';
import { AuthProvider } from './contexts/AuthContext';
import './styles/variables.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />

            <Route path="clients" element={<Clients />} />
            <Route path="coaches" element={<Coaches />} />

            <Route path="studios" element={<Studios />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="devices" element={<div>Devices Page</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
