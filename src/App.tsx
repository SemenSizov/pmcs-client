// App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import AuthCallback from './auth/AuthCallback';
import NotFound from './auth/NotFound';
import Dashboard from './pages/Dashboard';
import AdminRoutes from './routes/AdminRoutes';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/Navbar';
import MetersPage from './pages/MetersPage';
import PMCS from './pages/PMCS';
import { ToastContainer } from 'react-toastify';
import HomePage from './pages/HomePage'; // додай Home

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }
  const hideNavbar = location.pathname === '/' && !isAuthenticated;

  return (
    <>
      {!hideNavbar && <NavigationBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/user-not-found" element={<NotFound />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/meters"
          element={
            <ProtectedRoute>
              <div></div>
              {/* <MetersPage /> */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/pmcs"
          element={
            <ProtectedRoute>
              <PMCS />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
