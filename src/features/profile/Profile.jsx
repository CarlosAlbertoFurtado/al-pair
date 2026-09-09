import { useState, useEffect } from 'react';
import { Settings, Grid, Award, MapPin, Calendar, LogIn, Star, Globe, Briefcase, Users, ToggleRight, ToggleLeft, ChevronRight, ShieldAlert, FileText, CheckSquare, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { api } from '../../api';

export default function Profile() {
  const { user, userRole, logout } = useAuthStore();
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      api.get(`/users/${user.id}`)
        .then(res => {
          const u = res.data.data.user;
          setStats({
            postsCount: u._count?.posts || 0,
            followersCount: u._count?.followers || 0,
            followingCount: u._count?.following || 0,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  const menuSections = [
    {
      title: 'Minha Conta',
      items: [
        { icon: Grid, label: 'Meus Posts', badge: stats.postsCount },
        { icon: Star, label: 'Avaliações Recebidas' },
        { icon: Award, label: 'Conquistas' },
      ]
    },
    {
      title: 'Ferramentas',
      items: [
        { icon: FileText, label: 'Cofre Digital', desc: 'Documentos seguros', onClick: () => navigate('/vault') },
        { icon: CheckSquare, label: 'Minha Jornada', desc: 'Checklist de passos' },
        { icon: Building, label: 'Agências', desc: 'Avaliações reais' },
        { icon: ShieldAlert, label: 'SOS & Emergências', desc: 'Ajuda rápida' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { icon: Settings, label: 'Configurações' },
        { icon: Globe, label: 'Idioma' },
      ]
    }
  ];

  return (
    <div className="pb-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-rose-500 via-purple-500 to-indigo-600 p-6 pb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-2 border-white/30">
            {(user?.displayName || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.displayName || 'Usuário'}</h2>
            <p className="text-white/70 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
              {userRole === 'candidate' ? '🌍 Au Pair' : userRole === 'alumni' ? '🎓 Ex Au Pair' : '⭐ Mentora'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
          <div className="text-center">
            <p className="text-xl font-black">{stats.postsCount}</p>
            <p className="text-[11px] text-white/70 font-medium">Posts</p>
          </div>
          <div className="text-center border-x border-white/20 px-6">
            <p className="text-xl font-black">{stats.followersCount}</p>
            <p className="text-[11px] text-white/70 font-medium">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{stats.followingCount}</p>
            <p className="text-[11px] text-white/70 font-medium">Seguindo</p>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section, si) => (
        <div key={si} className="mt-4 mx-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">{section.title}</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {section.items.map((item, ii) => (
              <button key={ii} onClick={item.onClick} className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <item.icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  {item.desc && <p className="text-xs text-slate-400">{item.desc}</p>}
                </div>
                {item.badge !== undefined && (
                  <span className="text-xs font-bold text-slate-400">{item.badge}</span>
                )}
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <div className="mx-4 mt-6">
        <button
          onClick={logout}
          className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors text-sm"
        >
          <LogIn size={16} className="inline mr-2 rotate-180" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
