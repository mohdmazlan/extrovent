import './App.scss';
import { Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventCreatePage from './pages/EventCreatePage';
import PlacesPage from './pages/PlacesPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import PlaceCreatePage from './pages/PlaceCreatePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: '2rem' }}>Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function HomeProtected() {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: '2rem' }}>Checking session…</p>;
  return user ? (
    <AppShell>
      <HomePage />
    </AppShell>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<EventCreatePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/places/new" element={<PlaceCreatePage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
        <Route path="/" element={<HomeProtected />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
