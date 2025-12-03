import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Loading';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Vehicles = React.lazy(() => import('./pages/Vehicles'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Mechanics = React.lazy(() => import('./pages/Mechanics'));
const Stores = React.lazy(() => import('./pages/Stores'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const AIHistory = React.lazy(() => import('./pages/AIHistory'));
const Owners = React.lazy(() => import('./pages/Owners'));

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<Loading />}>
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
            <Route path="owners" element={<Owners />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
