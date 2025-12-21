import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
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
            <Route path="sessions" element={<div>Sessions Page</div>} />
            <Route path="clients" element={<div>Clients Page</div>} />
            <Route path="coaches" element={<div>Coaches Page</div>} />
            <Route path="studios" element={<div>Studios Page</div>} />
            <Route path="rooms" element={<div>Rooms Page</div>} />
            <Route path="devices" element={<div>Devices Page</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
