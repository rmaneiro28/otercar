import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Inventory from './pages/Inventory';
import Mechanics from './pages/Mechanics';
import Stores from './pages/Stores';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import AIHistory from './pages/AIHistory';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  // We might want to show a loading spinner here while checking auth
  // but for now, if user is null (and not loading, which is handled in AuthProvider), redirect
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="mechanics" element={<Mechanics />} />
          <Route path="stores" element={<Stores />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="ai-history" element={<AIHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
