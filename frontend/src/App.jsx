import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import DealerDashboard from './pages/dealer/DealerDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import BatchManagement from './pages/admin/BatchManagement';
import OrderManagement from './pages/admin/OrderManagement';
import Reports from './pages/admin/Reports';
import ActivityLogs from './pages/admin/ActivityLogs';

// Manager Pages
import ReportsPage from './pages/manager/ReportsPage';

// Chat
import ChatPage from './pages/chat/ChatPage';

// Tracking
import TrackingPage from './pages/customer/TrackingPage';
import DealerLocationSharer from './components/tracking/DealerLocationSharer';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/' && !user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isLandingPage && <Navbar />}

      <main className="flex-grow overflow-hidden flex flex-col">
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/landing" element={<LandingPage />} />  {/* Direct access to landing page */}

          {/* Protected — Admin Dashboard & Pages */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/batches"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <BatchManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ActivityLogs />
              </ProtectedRoute>
            }
          />
          
          {/* Protected — Other Dashboards */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dealer"
            element={
              <ProtectedRoute allowedRoles={['DEALER']}>
                <DealerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Chat */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DEALER', 'ADMIN']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Tracking — Customer */}
          <Route
            path="/tracking"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <TrackingPage />
              </ProtectedRoute>
            }
          />

          {/* Tracking — Dealer */}
          <Route
            path="/dealer/tracking"
            element={
              <ProtectedRoute allowedRoles={['DEALER']}>
                <DealerLocationSharer />
              </ProtectedRoute>
            }
          />

          {/* Redirect root by role (landing page for non-authenticated) */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </main>

      {!isLandingPage && <Footer />}
    </div>
  );
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  
  // If not logged in, show landing page
  if (!user) return <LandingPage />;
  
  // If logged in, redirect based on role
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN')    return <Navigate to="/admin"    replace />;
  if (role === 'MANAGER')  return <Navigate to="/manager"  replace />;
  if (role === 'DEALER')   return <Navigate to="/dealer"   replace />;
  if (role === 'CUSTOMER') return <Navigate to="/customer" replace />;
  return <Navigate to="/auth" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;