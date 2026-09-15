import { useState, useEffect } from 'react';
import { Plus, Headphones, Users, Mic, Clock, X, Crown, Radio } from 'lucide-react';
import { roomsAPI, resolveAssetUrl } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import LiveRoom from './LiveRoom';

// ─── Modal de criar sala ────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await roomsAPI.create({ title: title.trim(), description: description.trim() });
      onCreate(res.data.data.room);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao criar sala. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] bg-slate-950/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={onClose}>
      <div
        className="bg-slate-900 w-full max-w-[430px] rounded-t-3xl p-6 pb-10 border border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Nova Sala de Áudio</h2>
            <p className="text-xs text-slate-400 mt-0.5">Crie um espaço para a comunidade conversar</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white active:scale-90">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Título da Sala *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Dúvidas sobre visto Au Pair..."
              maxLength={80}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-slate-500 outline-none focus:border-rose-500 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Sobre o que vamos conversar..."
              rows={3}
              maxLength={200}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-slate-500 outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>
          {error && <p className="text-rose-400 text-sm font-medium">{error}</p>}
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner /> : <><Mic size={18} /> Criar e Entrar na Sala</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Card de sala ───────────────────────────────────────────────────────────
function RoomCard({ room, onJoin, isJoining }) {
  const hostAvatar = resolveAssetUrl(room.host?.avatarUrl);
  const hostInitial = (room.host?.displayName || 'H')[0].toUpperCase();
  const isLive = room.status === 'LIVE';

  return (
    <div
      className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/40 active:bg-slate-700/60 transition-colors cursor-pointer"
      onClick={() => !isJoining && onJoin(room)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isLive ? (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <Radio size={8} className="animate-pulse" /> Ao Vivo
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                <Clock size={8} /> Agendada
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white leading-snug">{room.title}</h3>
          {room.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
            {hostAvatar ? (
              <img src={hostAvatar} alt="" className="w-full h-full object-cover" />
            ) : hostInitial}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <Crown size={9} className="text-amber-400" />
              <p className="text-[10px] font-bold text-slate-300">{room.host?.displayName || 'Anfitrião'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-400">
            <Users size={13} />
            <span className="text-xs font-bold">{room.participantCount}/{room.maxParticipants}</span>
          </div>
          <button
            disabled={isJoining}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black active:scale-90 transition-all ${
              isLive
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {isJoining ? <LoadingSpinner /> : <><Headphones size={14} /> Entrar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tela principal ─────────────────────────────────────────────────────────
export default function AudioRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null); // dados do LiveKit para sala ativa
  const { user } = useAuthStore();

  const fetchRooms = async () => {
    try {
      const res = await roomsAPI.list();
      setRooms(res.data.data.rooms || []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000); // Atualiza a lista a cada 15s
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async (room) => {
    setJoiningId(room.id);
    try {
      // Garante que está registrado como participante no banco
      await roomsAPI.join(room.id);
      // Busca o token LiveKit
      const res = await roomsAPI.getToken(room.id);
      setActiveRoom(res.data.data);
    } catch (err) {
      alert(err?.response?.data?.message || 'Não foi possível entrar na sala.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async () => {
    // Tenta sair do banco de dados (best-effort)
    if (activeRoom) {
      const room = rooms.find(r => r.id === activeRoom.roomId);
      if (room) await roomsAPI.leave(room.id).catch(() => {});
    }
    setActiveRoom(null);
    fetchRooms();
  };

  const handleCreated = async (room) => {
    setShowCreate(false);
    setRooms(prev => [room, ...prev]);
    await handleJoin(room);
  };

  const liveRooms = rooms.filter(r => r.status === 'LIVE');
  const scheduledRooms = rooms.filter(r => r.status === 'SCHEDULED');

  return (
    <div className="min-h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Salas de Áudio</h1>
            <p className="text-sm text-slate-400 mt-0.5">Conversas ao vivo com a comunidade Au Pair</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black text-sm px-4 py-2.5 rounded-2xl active:scale-90 transition-transform shadow-lg shadow-rose-500/30"
          >
            <Plus size={18} />
            Criar
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-24 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Ao Vivo */}
            {liveRooms.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-rose-400">Ao Vivo Agora</p>
                </div>
                <div className="space-y-3">
                  {liveRooms.map(room => (
                    <RoomCard key={room.id} room={room} onJoin={handleJoin} isJoining={joiningId === room.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Agendadas */}
            {scheduledRooms.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Em Breve</p>
                <div className="space-y-3">
                  {scheduledRooms.map(room => (
                    <RoomCard key={room.id} room={room} onJoin={handleJoin} isJoining={joiningId === room.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Sem salas */}
            {rooms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-slate-800/60 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                  <Headphones size={32} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-300">Nenhuma sala ativa</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-[220px]">Seja a primeira a criar uma sala e conectar a comunidade!</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-6 flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black text-sm px-6 py-3 rounded-2xl active:scale-90 transition-transform shadow-lg"
                >
                  <Mic size={16} /> Criar a primeira sala
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de criar sala */}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}

      {/* Sala ativa (overlay de áudio) */}
      {activeRoom && (
        <LiveRoom roomData={activeRoom} onLeave={handleLeave} />
      )}
    </div>
  );
}
