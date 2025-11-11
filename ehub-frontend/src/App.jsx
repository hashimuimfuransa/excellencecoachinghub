import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/ui/Navbar';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import SelectLevel from './pages/SelectLevel';
import Homework from './pages/Homework';
import Leaderboard from './pages/Leaderboard';

// Import UI components
import Footer from './components/ui/Footer';

// Import dashboards
import StudentDashboard from './components/dashboard/StudentDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import ParentDashboard from './components/dashboard/ParentDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

const DashboardRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirected, setRedirected] = React.useState(false);

  // If we have user data from localStorage, don't show loading spinner
  const hasCachedUser = localStorage.getItem('user');

  React.useEffect(() => {
    // Only redirect if user is student or parent and doesn't have a level set
    if ((user?.role === 'student' || user?.role === 'parent') && !user?.level && !redirected) {
      setRedirected(true);
      navigate('/select-level', { replace: true });
    }
  }, [user?.role, user?.level, redirected, navigate]);

  // Show loading spinner only if we don't have cached user data
  if (loading && !hasCachedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If user is student or parent and doesn't have a level, show nothing while redirecting
  if ((user?.role === 'student' || user?.role === 'parent') && !user?.level) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/select-level"
            element={
              <ProtectedRoute allowedRoles={['student', 'parent']}>
                <SelectLevel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher']}>
                <Homework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;