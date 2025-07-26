import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import AuthCallback from './auth/AuthCallback';
import NotFound from './auth/NotFound';
import Dashboard from './pages/Dashboard';
import AdminRoutes from './routes/AdminRoutes';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/Navbar';
import MetersPage from './pages/MetersPage';
import PMCS from './pages/PMCS';
import { ToastContainer } from 'react-toastify';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/user-not-found" element={<NotFound />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminRoutes  />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meters"
          element={
            <ProtectedRoute>
              <MetersPage />
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
      </Routes>
    </BrowserRouter>  
    <ToastContainer/>
  </AuthProvider>
);

export default App;
