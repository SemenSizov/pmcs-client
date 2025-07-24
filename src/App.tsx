import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import AuthCallback from './auth/AuthCallback';
import NotFound from './auth/NotFound';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import NavigationBar from './components/Navbar';
import MetersPage from './pages/MetersPage';
import PMCS from './pages/PMCS';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/user-not-found" element={<NotFound />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
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
  </AuthProvider>
);

export default App;
