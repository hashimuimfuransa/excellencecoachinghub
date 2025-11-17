import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/ui/Navbar';

// Import internationalization
import './i18n';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherRegister from './pages/TeacherRegister';
import TestLanguagePage from './pages/TestLanguagePage';
import Home from './pages/Home';

import SelectLevel from './pages/SelectLevel';
import Homework from './pages/Homework';
import HomeworkList from './pages/HomeworkList';
import InteractiveHomework from './pages/InteractiveHomework';
import StudentHomeworkCreator from './pages/StudentHomeworkCreator';
import StudentCreatedHomework from './pages/StudentCreatedHomework';
import ReviewStudentHomework from './pages/ReviewStudentHomework';
import CreateHomework from './pages/CreateHomework';
import EditHomework from './pages/EditHomework';
import ManageHomework from './pages/ManageHomework';
import HomeworkReviews from './pages/HomeworkReviews';
import ReviewHomework from './pages/ReviewHomework';
import HomeworkHelp from './pages/HomeworkHelp';
import HomeworkHelpStudent from './pages/HomeworkHelpStudent';
import ManageStudents from './pages/ManageStudents';
import Leaderboard from './pages/Leaderboard';

// Import UI components
import Footer from './components/ui/Footer';

// Import dashboards
import StudentDashboard from './components/dashboard/StudentDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

const DashboardRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirected, setRedirected] = React.useState(false);

  // If we have user data from localStorage, don't show loading spinner
  const hasCachedUser = localStorage.getItem('user');

  React.useEffect(() => {
    // Only redirect if user is student and doesn't have a level set
    if (user?.role === 'student' && !user?.level && !redirected) {
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

  // If user is student and doesn't have a level, show nothing while redirecting
  if (user?.role === 'student' && !user?.level) {
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
    case 'admin':
      return <AdminDashboard />;
    default:
      // If we have cached user data but no role, still show dashboard while verifying
      if (hasCachedUser) {
        // Try to parse the cached user to determine role
        try {
          const cachedUser = JSON.parse(hasCachedUser);
          switch (cachedUser.role) {
            case 'student':
              return <StudentDashboard />;
            case 'teacher':
              return <TeacherDashboard />;
            case 'admin':
              return <AdminDashboard />;
            default:
              return <Navigate to="/login" replace />;
          }
        } catch (e) {
          return <Navigate to="/login" replace />;
        }
      }
      return <Navigate to="/login" replace />;
  }
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    // Completely removed default spacing and added negative margin to pull content up
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col gap-0">
      <Navbar />
      {/* Strongly pull content upward to reduce space between navbar and login/register forms */}
      <main className="flex-grow -mt-8 md:mt-0 pt-0 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher" element={<TeacherRegister />} />
          <Route path="/test-language" element={<TestLanguagePage />} />

          <Route
            path="/select-level"
            element={
              <ProtectedRoute allowedRoles={['student']}>
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
            path="/homework/list"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher']}>
                <HomeworkList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <InteractiveHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/create"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <CreateHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <EditHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/manage"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ManageHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/reviews"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <HomeworkReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/review/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ReviewHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/help"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <HomeworkHelp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/help/request"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <HomeworkHelpStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/create/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentHomeworkCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/student"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <StudentCreatedHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homework/student/:id/review"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ReviewStudentHomework />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ManageStudents />
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