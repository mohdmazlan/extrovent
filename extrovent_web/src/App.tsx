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
import ViewProfilePage from './pages/ViewProfilePage';
import FindFriendsPage from './pages/FindFriendsPage';
import ContactsPage from './pages/ContactsPage';
import InvitePage from './pages/InvitePage';
import ChatroomListPage from './pages/ChatroomListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NotificationsPage from './pages/NotificationsPage';
import CreatePostPage from './pages/CreatePostPage';
import GalleryManagePage from './pages/GalleryManagePage';
import CommentPage from './pages/CommentPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import ActivityCreatePage from './pages/ActivityCreatePage';
import ExplorePage from './pages/ExplorePage';
import BusinessListPage from './pages/BusinessListPage';
import BusinessRegisterPage from './pages/BusinessRegisterPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import BusinessAboutPage from './pages/BusinessAboutPage';
import SettingsPage from './pages/SettingsPage';

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
      <ExplorePage />
    </AppShell>
  ) : (
    <HomePage />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/feed/new" element={<CreatePostPage />} />
          <Route path="/posts/new" element={<CreatePostPage />} />
          <Route path="/posts/:id/comments" element={<CommentPage />} />
          <Route path="/events/:id/comments" element={<CommentPage />} />
          <Route path="/places/:id/gallery" element={<GalleryManagePage />} />
          <Route path="/activities/:id/gallery" element={<GalleryManagePage />} />
          <Route path="/events/:id/gallery" element={<GalleryManagePage />} />
          <Route path="/gallery/:type/:id" element={<GalleryManagePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<EventCreatePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/new" element={<ActivityCreatePage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities/:id/edit" element={<ActivityCreatePage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/places/new" element={<PlaceCreatePage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/places/:id/edit" element={<PlaceCreatePage />} />
          <Route path="/business" element={<BusinessListPage />} />
          <Route path="/business/new" element={<BusinessRegisterPage />} />
          <Route path="/business/:id" element={<BusinessProfilePage />} />
          <Route path="/business/:id/edit" element={<BusinessAboutPage />} />
          <Route path="/profile" element={<ViewProfilePage />} />
          <Route path="/profile/edit" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users/:userId" element={<ViewProfilePage />} />
          <Route path="/users/:userId/posts" element={<ViewProfilePage />} />
          <Route path="/find-friends" element={<FindFriendsPage />} />
          <Route path="/friends/find" element={<FindFriendsPage />} />
          <Route path="/friends" element={<ContactsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/events/:id/invite" element={<InvitePage />} />
          <Route path="/chat" element={<ChatroomListPage />} />
          <Route path="/chat/:roomId" element={<ChatRoomPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="/" element={<HomeProtected />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
