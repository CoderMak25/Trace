import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import SavedEvents from './pages/SavedEvents';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-heading text-2xl tracking-tight text-ink/60 animate-pulse">Loading...</div>
      </div>
    );
  }
  return currentUser ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-heading text-2xl tracking-tight text-ink/60 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/event/:slug" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><SavedEvents /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
      <Route path="/teams/:id" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
