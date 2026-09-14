import { useState, useEffect } from 'react';
import { MapPin, MessageCircle, UserPlus, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, chatAPI, resolveAssetUrl } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

export default function MapScreen() {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Simular scan por proximidade
    const scanTimer = setTimeout(() => setScanning(false), 2500);
    
    // Buscar usuários da plataforma como "próximos"
    usersAPI.search({ limit: 12 })
      .then(res => {
        const users = (res.data.data.users || []).filter(u => u.id !== user?.id);
        setNearbyUsers(users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => clearTimeout(scanTimer);
  }, [user?.id]);

  const handleMessage = async (targetUser) => {
    try {
      const res = await chatAPI.getOrCreateDirect(targetUser.id);
      navigate('/chat', { state: { conversationId: res.data.data.conversation.id, user: targetUser } });
    } catch (err) {
      console.error('Chat failed:', err);
    }
  };

  const handleFollow = async (targetUser) => {
    try {
      await usersAPI.follow(targetUser.id);
      setNearbyUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u));
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-ping" style={{animationDuration: '4s'}}></div>
          <div className="absolute inset-[60px] rounded-full border border-rose-500/10 animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
          <div className="absolute inset-[120px] rounded-full border border-purple-500/15 animate-ping" style={{animationDuration: '3.5s', animationDelay: '1s'}}></div>
          <div className="absolute inset-[180px] rounded-full border border-rose-500/20 animate-pulse" style={{animationDuration: '2s'}}></div>
        </div>
        {/* Floating dots */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"
            style={{ 
              top: `${15 + Math.random() * 70}%`, 
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black">Radar Au Pairs</h1>
            <p className="text-sm text-slate-400">Encontre conexões perto de você</p>
          </div>
        </div>
      </div>

      {/* Scanning State */}
      {scanning && (
        <div className="relative z-10 flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500/20 to-purple-600/20 flex items-center justify-center animate-pulse">
              <Loader2 size={32} className="text-purple-400 animate-spin" />
            </div>
          </div>
          <p className="text-purple-300 font-bold mt-6 text-lg">Buscando Au Pairs...</p>
          <p className="text-slate-500 text-sm mt-2">Escaneando sua região</p>
        </div>
      )}

      {/* Results */}
      {!scanning && (
        <div className="relative z-10 px-4 pb-8">
          {/* Stats */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
              <p className="text-2xl font-black text-rose-400">{nearbyUsers.length}</p>
              <p className="text-[11px] text-slate-400 font-medium">Au Pairs encontradas</p>
            </div>
            <div className="flex-1 bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
              <p className="text-2xl font-black text-purple-400">{user?.city || '—'}</p>
              <p className="text-[11px] text-slate-400 font-medium">Sua região</p>
            </div>
          </div>

          {/* User Cards */}
          <div className="space-y-3">
            {nearbyUsers.map((u, i) => {
              const avatar = resolveAssetUrl(u.avatarUrl);
              const distance = Math.floor(Math.random() * 45) + 1; // Simulated
              const roleLabel = u.role === 'CANDIDATE' ? '🌍 Quer ser Au Pair' : u.role === 'ALUMNI' ? '🎓 Ex Au Pair' : '⭐ Au Pair';
              return (
                <div 
                  key={u.id}
                  className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 active:bg-slate-700/60 transition-colors"
                  style={{ animationDelay: `${i * 100}ms` }}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white">{(u.displayName || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-slate-800 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} className="text-rose-400" />
                      <span className="text-[11px] text-rose-400 font-semibold">~{distance} km de distância</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleFollow(u); }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-90 ${u.isFollowing ? 'bg-slate-700 text-slate-400' : 'bg-purple-600 text-white'}`}
                    >
                      <UserPlus size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMessage(u); }}
                      className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {nearbyUsers.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-bold">Nenhuma Au Pair encontrada</p>
              <p className="text-slate-600 text-sm mt-2">Tente novamente mais tarde</p>
            </div>
          )}
        </div>
      )}

      {/* Selected User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-800 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 p-[2px] mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  {resolveAssetUrl(selectedUser.avatarUrl) ? (
                    <img src={resolveAssetUrl(selectedUser.avatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{(selectedUser.displayName || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-black text-white">{selectedUser.displayName}</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedUser.bio || 'Au Pair Conectada'}</p>
              {selectedUser.city && (
                <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1">
                  <MapPin size={12} /> {selectedUser.city}{selectedUser.country ? `, ${selectedUser.country}` : ''}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => { navigate(`/user/${selectedUser.id}`); setSelectedUser(null); }}
                className="py-3 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-700 active:scale-95 transition-all"
              >
                Ver Perfil
              </button>
              <button 
                onClick={() => { handleMessage(selectedUser); setSelectedUser(null); }}
                className="py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl text-sm active:scale-95 transition-all shadow-lg"
              >
                Mensagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
