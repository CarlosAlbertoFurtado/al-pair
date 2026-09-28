import { useNavigate } from 'react-router-dom';
import { Home, Users, Bell, MessageCircle, MapPin, Info, Zap, Search, Gift, Settings, X, ChevronRight, User } from 'lucide-react';

const DrawerLink = ({ icon: Icon, label, to, badge, badgeTone = 'rose', navigate, onClose }) => (
  <button 
    onClick={() => { onClose(); navigate(to); }} 
    className="flex items-center gap-4 w-full p-3 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
  >
    <Icon size={22} className="text-slate-400" />
    <span className="text-sm font-semibold flex-1 text-left">{label}</span>
    {badge && <span className={`${badgeTone === 'green' ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-[9px] font-black px-2 py-0.5 rounded-full`}>{badge}</span>}
    <ChevronRight size={16} className="text-slate-400" />
  </button>
);

export default function DrawerMenu({ isOpen, onClose, user, avatarUrl, unreadCount, unreadChatCount }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Drawer Menu */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="bg-gradient-to-br from-rose-50 via-white to-purple-50 p-6 pt-10 border-b border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <button 
              onClick={() => { onClose(); navigate('/profile'); }} 
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 p-[2px] active:scale-95 transition-transform"
            >
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-slate-400" />
                )}
              </div>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/50 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-100 active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-slate-900 text-xl font-bold">{user?.displayName || 'Olá, Au Pair'}</h2>
          <p className="text-slate-500 text-sm mt-1">{user?.role === 'CANDIDATE' ? 'Au Pair' : user?.role === 'ALUMNI' ? 'Ex-Au Pair' : 'Au Pair'}</p>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <DrawerLink to="/" icon={Home} label="Início" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/rooms" icon={Users} label="Comunidade" badge="Novo" badgeTone="green" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/notifications" icon={Bell} label="Notificações" badge={unreadCount > 0 ? unreadCount : undefined} navigate={navigate} onClose={onClose} />
          <DrawerLink to="/chat" icon={MessageCircle} label="Chat" badge={unreadChatCount > 0 ? unreadChatCount : undefined} badgeTone="green" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/map" icon={MapPin} label="Radar Au Pairs" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/journey" icon={Info} label="Minha Jornada" navigate={navigate} onClose={onClose} />
          
          <div className="h-px bg-slate-100 my-4 mx-2"></div>
          
          <DrawerLink to="/emergency" icon={Zap} label="SOS & Emergências" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/search" icon={Search} label="Buscar Pessoas" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/referral" icon={Gift} label="Indique e Ganhe" navigate={navigate} onClose={onClose} />
          <DrawerLink to="/profile" icon={Settings} label="Configurações" navigate={navigate} onClose={onClose} />
        </div>
        
        <div className="p-4 text-center border-t border-slate-100">
          <p className="text-slate-500 text-xs">Versão 2.1.0 Premium</p>
        </div>
      </div>
    </>
  );
}
