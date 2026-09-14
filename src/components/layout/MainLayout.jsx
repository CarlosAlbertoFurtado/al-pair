import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Headphones, Plus, MessageCircle, User, Search, Bell, Menu, X, ChevronRight, Zap, MapPin, Users, Info, Settings, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { chatAPI, getSocket, notificationsAPI, resolveAssetUrl } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import CreatePostModal from '../../features/create/CreatePostModal';
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
    <button onClick={() => { setIsDrawerOpen(false); navigate(to); }} className="flex items-center gap-4 w-full p-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors active:scale-95">
      <Icon size={22} className="text-slate-400" />
      <span className="text-sm font-semibold flex-1 text-left">{label}</span>
      {badge && <span className={`${badgeTone === 'green' ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-[9px] font-black px-2 py-0.5 rounded-full`}>{badge}</span>}
      <ChevronRight size={16} className="text-slate-600" />
    </button>
  );

  return (
    <div className="w-full max-w-[430px] mx-auto h-screen bg-white relative overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)]">
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

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer Menu - z-index mais alto que tudo */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-slate-900 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 pt-10 border-b border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 p-[2px]">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-slate-400" />
                )}
              </div>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-slate-800/50 rounded-full text-slate-400 hover:text-white active:scale-90">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-white text-xl font-bold">{user?.displayName || 'Olá, Au Pair'}</h2>
          <p className="text-slate-400 text-sm mt-1">{user?.role === 'CANDIDATE' ? 'Quero ser Au Pair' : user?.role === 'ALUMNI' ? 'Ex-Au Pair' : 'Au Pair'}</p>
          
          <div className="flex gap-3 mt-6">
            <div className="flex-1 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plano</p>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Free</span>
                <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">PRO</span>
              </div>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Créditos</p>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">5</span>
                <button className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white"><Plus size={14} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <DrawerLink to="/" icon={Home} label="Início" />
          <DrawerLink to="/rooms" icon={Users} label="Comunidade" />
          <DrawerLink to="/notifications" icon={Bell} label="Notificações" badge={unreadCount > 0 ? unreadCount : undefined} />
          <DrawerLink to="/chat" icon={MessageCircle} label="Chat" badge={unreadChatCount > 0 ? unreadChatCount : undefined} badgeTone="green" />
          <DrawerLink to="/map" icon={MapPin} label="Radar Au Pairs" />
          <DrawerLink to="/journey" icon={Info} label="Minha Jornada" />
          
          <div className="h-px bg-slate-800 my-4 mx-2"></div>
          
          <DrawerLink to="/emergency" icon={Zap} label="SOS & Emergências" />
          <DrawerLink to="/search" icon={Search} label="Buscar Pessoas" />
          <DrawerLink to="/" icon={Gift} label="Indique e Ganhe" />
          <DrawerLink to="/profile" icon={Settings} label="Configurações" />
        </div>
        
        <div className="p-4 text-center border-t border-slate-800">
          <p className="text-slate-500 text-xs">Versão 2.1.0 Premium</p>
        </div>
      </div>

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
