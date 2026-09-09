import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

export default function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
