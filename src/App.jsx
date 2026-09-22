import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useAudioRoomStore } from './store/useAudioRoomStore';
import { LoadingSpinner } from './components/LoadingSpinner';
import InstallPrompt from './components/InstallPrompt';

// Layout
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Lazy load screens
const HomeFeed = lazy(() => import('./features/feed/HomeFeed'));
const ChatList = lazy(() => import('./features/chat/ChatList'));
const Profile = lazy(() => import('./features/profile/Profile'));
const LoginScreen = lazy(() => import('./features/auth/LoginScreen'));
const ForgotPasswordScreen = lazy(() => import('./features/auth/ForgotPasswordScreen'));
const ResetPasswordScreen = lazy(() => import('./features/auth/ResetPasswordScreen'));
const AudioRooms = lazy(() => import('./features/rooms/AudioRooms'));
const SearchScreen = lazy(() => import('./features/search/SearchScreen'));
const NotificationsScreen = lazy(() => import('./features/notifications/NotificationsScreen'));
const JourneyScreen = lazy(() => import('./features/journey/JourneyScreen'));
const EmergencyScreen = lazy(() => import('./features/emergency/EmergencyScreen'));
const MyPostsScreen = lazy(() => import('./features/profile/MyPostsScreen'));
const UserProfileScreen = lazy(() => import('./features/profile/UserProfileScreen'));
const LegalScreen = lazy(() => import('./features/legal/LegalScreen'));
const MapScreen = lazy(() => import('./features/map/MapScreen'));
const LiveRoom = lazy(() => import('./features/rooms/LiveRoom'));
const InviteScreen = lazy(() => import('./features/invite/InviteScreen'));

export default function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { activeRoom, clearRoom } = useAudioRoomStore();

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
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordScreen />} />
          <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordScreen />} />
          <Route path="/legal/:page" element={<LegalScreen />} />
        </Route>

        {/* Private Routes */}
        <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<HomeFeed />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rooms" element={<AudioRooms />} />
          <Route path="/vault" element={<Navigate to="/profile" replace />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/journey" element={<JourneyScreen />} />
          <Route path="/emergency" element={<EmergencyScreen />} />
          <Route path="/my-posts" element={<MyPostsScreen />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/referral" element={<InviteScreen />} />
          <Route path="/user/:id" element={<UserProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      
      {/* Global Audio Room (Floating Player) */}
      {activeRoom && isAuthenticated && (
        <LiveRoom roomData={activeRoom} onLeave={clearRoom} />
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </Suspense>
  );
}
