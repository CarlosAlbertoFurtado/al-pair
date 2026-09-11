import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { LoadingSpinner } from './components/LoadingSpinner';

// Layout
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Lazy load screens
const HomeFeed = lazy(() => import('./features/feed/HomeFeed'));
const ChatList = lazy(() => import('./features/chat/ChatList'));
const Profile = lazy(() => import('./features/profile/Profile'));
const LoginScreen = lazy(() => import('./features/auth/LoginScreen'));
const AudioRooms = lazy(() => import('./features/rooms/AudioRooms'));
const VaultScreen = lazy(() => import('./features/vault/VaultScreen'));
const SearchScreen = lazy(() => import('./features/search/SearchScreen'));
const NotificationsScreen = lazy(() => import('./features/notifications/NotificationsScreen'));
const JourneyScreen = lazy(() => import('./features/journey/JourneyScreen'));
const EmergencyScreen = lazy(() => import('./features/emergency/EmergencyScreen'));
const MyPostsScreen = lazy(() => import('./features/profile/MyPostsScreen'));
const UserProfileScreen = lazy(() => import('./features/profile/UserProfileScreen'));

export default function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>}>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />} 
          />
        </Route>

        {/* Private Routes */}
        <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<HomeFeed />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rooms" element={<AudioRooms />} />
          <Route path="/vault" element={<VaultScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/journey" element={<JourneyScreen />} />
          <Route path="/emergency" element={<EmergencyScreen />} />
          <Route path="/my-posts" element={<MyPostsScreen />} />
          <Route path="/user/:id" element={<UserProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
