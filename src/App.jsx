import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Loading';

// Robust lazy load with retry logic for failed chunks (common after new deploys)
const lazyRetry = (componentImport) =>
  React.lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });

// Lazy load pages
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const Vehicles = lazyRetry(() => import('./pages/Vehicles'));
const Inventory = lazyRetry(() => import('./pages/Inventory'));
const Mechanics = lazyRetry(() => import('./pages/Mechanics'));
const Stores = lazyRetry(() => import('./pages/Stores'));
const Login = lazyRetry(() => import('./pages/Login'));
const Register = lazyRetry(() => import('./pages/Register'));
const Profile = lazyRetry(() => import('./pages/Profile'));
const Settings = lazyRetry(() => import('./pages/Settings'));
const Maintenance = lazyRetry(() => import('./pages/Maintenance'));
const AIHistory = lazyRetry(() => import('./pages/AIHistory'));

const Owners = lazyRetry(() => import('./pages/Owners'));
const Documents = lazyRetry(() => import('./pages/Documents'));
const Fuel = lazyRetry(() => import('./pages/Fuel'));
const CalendarPage = lazyRetry(() => import('./pages/CalendarPage'));

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
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
              <Route path="documents" element={<Documents />} />
              <Route path="fuel" element={<Fuel />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
