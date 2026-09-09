import { useState, useEffect } from 'react';
import { Headphones, Mic, Users, Plus } from 'lucide-react';
import { roomsAPI } from '../../api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function AudioRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomsAPI.list()
      .then(res => {
        setRooms(res.data.data.rooms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (roomId) => {
    try {
      await roomsAPI.join(roomId);
      // Refresh rooms
      const res = await roomsAPI.list();
      setRooms(res.data.data.rooms || []);
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><LoadingSpinner /></div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">🎙️ Salas ao Vivo</h2>
        <button className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Criar Sala
        </button>
      </div>

      {!rooms.length ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="text-4xl mb-4">🎧</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma sala ativa</h3>
          <p className="text-sm text-slate-400">Crie a primeira sala e converse ao vivo!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{room.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{room.description || 'Sala de conversa'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  room.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {room.status === 'LIVE' ? '🔴 Ao Vivo' : 'Agendada'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={14} />
                  <span className="text-xs font-medium">{room._count?.participants || 0} participantes</span>
                </div>
                <button
                  onClick={() => handleJoin(room.id)}
                  className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold hover:bg-purple-200 transition-colors"
                >
                  <Headphones size={14} className="inline mr-1" />
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
