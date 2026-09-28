import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Headphones, Plus, MessageCircle, User, Search, Bell, Menu, X, ChevronRight, Zap, MapPin, Users, Info, Settings, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { chatAPI, getSocket, notificationsAPI, resolveAssetUrl } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import CreatePostModal from '../../features/create/CreatePostModal';
import DrawerMenu from './DrawerMenu';
import { PenSquare } from 'lucide-react';

function NavItem({ to, icon: Icon, label, badge, badgeTone = 'rose' }) {
  const badgeClass = badgeTone === 'green' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative active:scale-95 ${
          isActive
            ? 'text-rose-500'
            : 'text-slate-400 hover:text-slate-600'
        }`
      }
    >
      <Icon size={24} strokeWidth={1.8} />
      <span className="text-[10px] font-semibold">{label}</span>
      {badge && (
        <span className={`absolute -top-1 -right-0.5 ${badgeClass} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-lg ${badgeTone === 'green' ? 'shadow-emerald-500/30 animate-pulse' : ''}`}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function MainLayout() {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'post' | null
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Resolver avatar URL corretamente
  const avatarUrl = resolveAssetUrl(user?.avatarUrl);

  useEffect(() => {
    notificationsAPI.list()
      .then(res => setUnreadCount(res.data.data.unreadCount || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshUnreadChats = async () => {
      try {
        const res = await chatAPI.getConversations();
        if (!mounted) return;
        const total = (res.data.data.conversations || [])
          .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadChatCount(total);
      } catch {}
    };

    refreshUnreadChats();
    const socket = getSocket();
    const handleNewMessage = (data) => {
      const senderId = data?.message?.sender?.id || data?.message?.senderId;
      if (senderId === user?.id) return;
      if (!location.pathname.startsWith('/chat')) {
        setUnreadChatCount(prev => prev + 1);
      }
      setTimeout(refreshUnreadChats, 300);
    };
    const handleRead = () => setTimeout(refreshUnreadChats, 200);

    socket?.on('message:new', handleNewMessage);
    socket?.on('messages:read', handleRead);
    window.addEventListener('focus', refreshUnreadChats);

    return () => {
      mounted = false;
      socket?.off('message:new', handleNewMessage);
      socket?.off('messages:read', handleRead);
      window.removeEventListener('focus', refreshUnreadChats);
    };
  }, [location.pathname, user?.id]);

  // Fechar o drawer ao mudar de rota
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);

  const DrawerLink = ({ icon: Icon, label, to, badge, badgeTone = 'rose' }) => (
    <button onClick={() => { setIsDrawerOpen(false); navigate(to); }} className="flex items-center gap-4 w-full p-3 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95">
      <Icon size={22} className="text-slate-400" />
      <span className="text-sm font-semibold flex-1 text-left">{label}</span>
      {badge && <span className={`${badgeTone === 'green' ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-[9px] font-black px-2 py-0.5 rounded-full`}>{badge}</span>}
      <ChevronRight size={16} className="text-slate-400" />
    </button>
  );

  return (
    <div className="w-full max-w-[430px] mx-auto bg-white relative flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)]" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-rose-100 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={toggleDrawer} className="p-2 -ml-2 rounded-full hover:bg-rose-50 transition-colors text-slate-700 active:scale-90">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            AuPairConnect
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/search')} className="p-2 -mr-1 rounded-full hover:bg-rose-50 transition-colors relative text-slate-700 active:scale-90">
            <Search size={22} />
          </button>
          <button onClick={() => navigate('/notifications')} className="p-2 -mr-2 rounded-full hover:bg-rose-50 transition-colors relative text-slate-700 active:scale-90">
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      <DrawerMenu 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        avatarUrl={avatarUrl}
        unreadCount={unreadCount}
        unreadChatCount={unreadChatCount}
      />

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 overscroll-y-none">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around bg-white border-t border-slate-200 px-2 py-2 pb-6 absolute bottom-0 w-full z-10 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavItem to="/" icon={Home} label="Início" />
        <NavItem to="/rooms" icon={Headphones} label="Salas" />
        
        <button 
          onClick={() => setShowCreateMenu(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-full hover:scale-105 transition-transform active:scale-90 -mt-8 shadow-lg shadow-rose-300"
        >
          <Plus size={28} />
        </button>

        <NavItem to="/chat" icon={MessageCircle} label="Chat" badge={unreadChatCount > 0 ? unreadChatCount : undefined} badgeTone="green" />
        <NavItem to="/profile" icon={User} label="Perfil" />
      </nav>

      {/* Create Selection Menu */}
      {showCreateMenu && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowCreateMenu(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">O que deseja criar?</h2>
              <button onClick={() => setShowCreateMenu(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 active:scale-90">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => { setShowCreateMenu(false); setActiveModal('post'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-300 hover:bg-rose-50 transition-all group active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PenSquare size={28} />
                </div>
                <span className="font-bold text-slate-700">Publicação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Modals */}
      {activeModal === 'post' && (
        <CreatePostModal 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => {
            setActiveModal(null);
            window.location.reload(); 
          }} 
        />
      )}
    </div>
  );
}
