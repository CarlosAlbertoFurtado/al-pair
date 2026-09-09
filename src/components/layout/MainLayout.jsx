import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Headphones, Plus, MessageCircle, User, Search, Bell } from 'lucide-react';
import { useState } from 'react';

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

export default function MainLayout() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="w-full max-w-[430px] mx-auto h-screen bg-white relative overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-rose-100 z-10 sticky top-0">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          AuPairConnect
        </h1>
        <div className="flex gap-3">
          <button className="p-2 -mr-2 rounded-full hover:bg-rose-50 transition-colors relative text-slate-700">
            <Search size={22} />
          </button>
          <button className="p-2 -mr-2 rounded-full hover:bg-rose-50 transition-colors relative text-slate-700">
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
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
        <NavItem to="/rooms" icon={Headphones} label="Salas" badge="Ao Vivo" />
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-full hover:scale-105 transition-transform active:scale-95 -mt-8 shadow-lg shadow-rose-300"
        >
          <Plus size={28} />
        </button>

        <NavItem to="/chat" icon={MessageCircle} label="Chat" badge="5" />
        <NavItem to="/profile" icon={User} label="Perfil" />
      </nav>

      {/* Create Modal placeholder – will be expanded later */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Criar Novo</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <span className="text-lg">✕</span>
              </button>
            </div>
            <p className="text-slate-500 text-center text-sm">Em breve: publicação, story, sala de áudio...</p>
          </div>
        </div>
      )}
    </div>
  );
}
