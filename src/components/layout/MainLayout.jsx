import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Headphones, Plus, MessageCircle, User, Search, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../api';

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
          isActive
            ? 'text-rose-500'
            : 'text-slate-400 hover:text-slate-600'
        }`
      }
    >
      <Icon size={24} strokeWidth={1.8} />
      <span className="text-[10px] font-semibold">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

import CreatePostModal from '../../features/create/CreatePostModal';
import CreateRoomModal from '../../features/create/CreateRoomModal';
import { PenSquare, Mic } from 'lucide-react';

export default function MainLayout() {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'post' | 'room' | null
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    notificationsAPI.list()
      .then(res => setUnreadCount(res.data.data.unreadCount || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-[430px] mx-auto h-screen bg-white relative overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-rose-100 z-10 sticky top-0">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          AuPairConnect
        </h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/search')} className="p-2 -mr-2 rounded-full hover:bg-rose-50 transition-colors relative text-slate-700">
            <Search size={22} />
          </button>
          <button onClick={() => navigate('/notifications')} className="p-2 -mr-2 rounded-full hover:bg-rose-50 transition-colors relative text-slate-700">
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around bg-white border-t border-slate-200 px-2 py-2 pb-6 absolute bottom-0 w-full z-10 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavItem to="/" icon={Home} label="Início" />
        <NavItem to="/rooms" icon={Headphones} label="Salas" />
        
        <button 
          onClick={() => setShowCreateMenu(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-full hover:scale-105 transition-transform active:scale-95 -mt-8 shadow-lg shadow-rose-300"
        >
          <Plus size={28} />
        </button>

        <NavItem to="/chat" icon={MessageCircle} label="Chat" />
        <NavItem to="/profile" icon={User} label="Perfil" />
      </nav>

      {/* Create Selection Menu */}
      {showCreateMenu && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowCreateMenu(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">O que deseja criar?</h2>
              <button onClick={() => setShowCreateMenu(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <span className="text-lg">✕</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setShowCreateMenu(false); setActiveModal('post'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-300 hover:bg-rose-50 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PenSquare size={28} />
                </div>
                <span className="font-bold text-slate-700">Publicação</span>
              </button>
              
              <button 
                onClick={() => { setShowCreateMenu(false); setActiveModal('room'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mic size={28} />
                </div>
                <span className="font-bold text-slate-700">Sala de Áudio</span>
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
            // In a real app we'd refresh the feed here or use global state
            window.location.reload(); 
          }} 
        />
      )}
      {activeModal === 'room' && (
        <CreateRoomModal 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => {
            setActiveModal(null);
            window.location.href = '/rooms';
          }} 
        />
      )}
    </div>
  );
}
