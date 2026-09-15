import { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTracks,
  TrackToggle,
  useChat,
  useDataChannel,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { Mic, MicOff, LogOut, Users, Volume2, MessageSquare, Hand, Send, ChevronDown, Maximize2, X, PhoneOff } from 'lucide-react';
import { useAudioRoomStore } from '../../store/useAudioRoomStore';
import { resolveAssetUrl, roomsAPI } from '../../api';

// Fundo das salas - usando <img> para evitar bloqueio de CSP
const ROOM_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80',
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1200&q=80',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e2815cb?w=1200&q=80',
];

// ─── Modal de Perfil ──────────────────────────────────────────────────────────
function ProfileModal({ participant, onClose }) {
  let avatarUrl = null;
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata);
      if (meta.avatarUrl) avatarUrl = resolveAssetUrl(meta.avatarUrl);
    }
  } catch (e) {}
  const name = participant.name || participant.identity;
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : initial}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">{participant.permissions?.canPublish ? '🎙️ Palestrante' : '👂 Ouvinte'}</p>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-100 rounded-full text-slate-500">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Chat da Sala ─────────────────────────────────────────────────────────────
function RoomChat() {
  const { send, chatMessages } = useChat();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) { send(message.trim()); setMessage(''); }
  };

  return (
    <div className="flex flex-col bg-white/70 backdrop-blur-2xl border-t border-white/50" style={{ height: 220 }}>
      <div className="flex-1 overflow-y-auto px-4 pt-3 space-y-2" ref={scrollRef}>
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 pb-2">
            <MessageSquare size={20} className="mb-1 opacity-40" />
            <p className="text-[11px]">Chat ao vivo – mande um oi! 👋</p>
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 ml-2 mb-0.5">{msg.from?.name || 'Alguém'}</span>
            <div className="bg-white/90 px-3 py-2 rounded-2xl rounded-tl-sm text-sm text-slate-700 w-fit max-w-[90%] shadow-sm border border-slate-100">
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 px-3 py-2.5 border-t border-white/40 bg-white/60">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Diga algo para a sala..."
          className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-rose-400 transition-colors"
        />
        <button type="submit" disabled={!message.trim()} className="w-9 h-9 bg-gradient-to-tr from-rose-500 to-purple-500 text-white rounded-full flex items-center justify-center disabled:opacity-40 shadow-md active:scale-90 transition-transform flex-shrink-0">
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

// ─── Card de participante ─────────────────────────────────────────────────────
function ParticipantCard({ participant, isSpeaker, onPress }) {
  const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: false });
  const audioTrack = tracks.find(t => t.participant.identity === participant.identity);
  const isSpeaking = audioTrack?.participant?.isSpeaking ?? false;

  let avatarUrl = null;
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata);
      if (meta.avatarUrl) avatarUrl = resolveAssetUrl(meta.avatarUrl);
    }
  } catch (e) {}

  const name = participant.name || participant.identity;
  const initial = name[0]?.toUpperCase() || '?';
  const size = isSpeaker ? 'w-16 h-16' : 'w-12 h-12';

  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => onPress(participant)}>
      <div className={`relative ${size} rounded-full overflow-hidden flex items-center justify-center text-white font-black text-lg shadow-lg transition-all duration-200 ${
        isSpeaking ? 'ring-4 ring-rose-400 ring-offset-2 scale-105 shadow-rose-500/50' : 'border-2 border-white/80'
      } ${!avatarUrl ? 'bg-gradient-to-tr from-rose-400 to-purple-500' : ''}`}>
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : <span>{initial}</span>
        }
        {isSpeaker && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Mic size={10} className="text-white" />
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-700 font-bold text-center truncate w-full max-w-[60px]">
        {name.split(' ')[0]}
      </p>
    </div>
  );
}

// ─── Painel principal da sala ─────────────────────────────────────────────────
function RoomPanel({ room, onLeave }) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const { isMinimized, setMinimized } = useAudioRoomStore();
  const { send: sendHandRaise, message: handRaiseMsg } = useDataChannel('hand-raise');
  const [raisedHands, setRaisedHands] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    if (handRaiseMsg) {
      const payload = new TextDecoder().decode(handRaiseMsg.payload);
      if (payload === 'RAISE_HAND') {
        const fromId = handRaiseMsg.from?.identity;
        if (fromId && !raisedHands.includes(fromId)) setRaisedHands(prev => [...prev, fromId]);
      }
    }
  }, [handRaiseMsg]);

  useEffect(() => {
    if (localParticipant?.permissions?.canPublish) {
      localParticipant.setMicrophoneEnabled(true).catch(console.warn);
    }
  }, [localParticipant?.permissions?.canPublish, localParticipant]);

  const speakers = participants.filter(p => p.permissions?.canPublish);
  const listeners = participants.filter(p => !p.permissions?.canPublish);
  const amISpeaker = localParticipant?.permissions?.canPublish;

  const handleExit = async () => {
    try {
      if (room?.isHost) {
        await roomsAPI.end(room.roomId);
      } else {
        await roomsAPI.leave(room.roomId);
      }
    } catch (e) { console.warn('exit err', e); }
    onLeave();
  };

  const handleApproveSpeaker = async (id) => {
    try {
      await roomsAPI.approveSpeaker(room.roomId, id);
      setRaisedHands(prev => prev.filter(h => h !== id));
    } catch (e) { alert('Erro ao aprovar participante.'); }
  };

  // Mini-player minimizado
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 left-3 right-3 bg-white border border-slate-200 shadow-2xl rounded-2xl p-3 flex items-center gap-3 z-[100]">
        <RoomAudioRenderer />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-rose-500">Ao vivo</span>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">{room?.roomName}</p>
        </div>
        <div className="flex gap-2">
          {amISpeaker && (
            <TrackToggle source={Track.Source.Microphone} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center active:scale-95">
              {isMicrophoneEnabled ? <Mic size={16} className="text-rose-500" /> : <MicOff size={16} className="text-slate-400" />}
            </TrackToggle>
          )}
          <button onClick={() => setMinimized(false)} className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-95">
            <Maximize2 size={16} />
          </button>
          <button onClick={handleExit} className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center active:scale-95">
            <PhoneOff size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Modal de perfil */}
      {selectedProfile && <ProfileModal participant={selectedProfile} onClose={() => setSelectedProfile(null)} />}

      {/* Confirmação encerrar sala */}
      {showEndConfirm && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={28} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-1">Encerrar Sala?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Todos os participantes serão desconectados e a sala será apagada.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm active:bg-slate-50">
                Cancelar
              </button>
              <button onClick={handleExit} className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-black text-sm shadow-lg active:bg-rose-600">
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-5 pt-10 pb-4 flex items-start justify-between border-b border-white/50 shadow-sm z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">Ao Vivo</span>
            <span className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 ml-1">
              <Users size={10} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-700">{participants.length}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 leading-tight">{room?.roomName}</h2>
        </div>
        <button onClick={() => setMinimized(true)} className="p-2 bg-white/60 rounded-full border border-slate-200 text-slate-600 active:scale-95">
          <ChevronDown size={22} />
        </button>
      </div>

      {/* Participantes */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {speakers.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">🎙️ Palestrantes ({speakers.length}/8)</p>
            <div className="grid grid-cols-4 gap-3">
              {speakers.map(p => <ParticipantCard key={p.identity} participant={p} isSpeaker onPress={setSelectedProfile} />)}
            </div>
          </div>
        )}

        {listeners.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              <Volume2 size={10} className="inline mr-1" />OUVINTES ({listeners.length})
            </p>
            <div className="grid grid-cols-5 gap-2">
              {listeners.map(p => {
                const isRaised = raisedHands.includes(p.identity);
                return (
                  <div key={p.identity} className="relative">
                    <ParticipantCard participant={p} isSpeaker={false} onPress={setSelectedProfile} />
                    {isRaised && (
                      <div className="absolute -top-1 -right-1">
                        <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md animate-bounce">
                          <Hand size={11} className="text-white" />
                        </span>
                        {room?.isHost && (
                          <div 
                            className="absolute top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow cursor-pointer active:scale-95"
                            onClick={(e) => { e.stopPropagation(); handleApproveSpeaker(p.identity); }}
                          >
                            Aceitar
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <RoomAudioRenderer />

      {/* Chat sempre visível */}
      <RoomChat />

      {/* Botões flutuantes */}
      <div className="absolute right-4 bottom-[238px] flex flex-col gap-2.5 z-30">
        {amISpeaker ? (
          <TrackToggle source={Track.Source.Microphone} className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-lg active:scale-90">
            {isMicrophoneEnabled ? <Mic size={18} className="text-rose-500" /> : <MicOff size={18} className="text-slate-400" />}
          </TrackToggle>
        ) : (
          <button
            onClick={() => sendHandRaise(new TextEncoder().encode('RAISE_HAND'), { reliable: true })}
            className="w-11 h-11 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-400/40 active:scale-90"
          >
            <Hand size={18} />
          </button>
        )}

        <button
          onClick={() => room?.isHost ? setShowEndConfirm(true) : handleExit()}
          className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-400/40 active:scale-90"
        >
          <PhoneOff size={17} />
        </button>
      </div>
    </div>
  );
}

// ─── Componente raiz ──────────────────────────────────────────────────────────
export default function LiveRoom({ roomData, onLeave }) {
  const { isMinimized } = useAudioRoomStore();
  if (!roomData?.token || !roomData?.livekitUrl) return null;

  const bgIndex = roomData.roomId ? roomData.roomId.charCodeAt(0) % ROOM_BACKGROUNDS.length : 0;
  const backgroundUrl = ROOM_BACKGROUNDS[bgIndex];

  return (
    <div className={`fixed z-[90] flex flex-col ${isMinimized ? 'pointer-events-none inset-0' : 'inset-0 bg-slate-100'}`}>
      {/* Imagem de fundo usando <img> para evitar bloqueios de CSP */}
      {!isMinimized && (
        <>
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.35 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-slate-50/80 to-white/95 backdrop-blur-sm" />
        </>
      )}

      <div className={`relative z-10 flex-1 flex flex-col ${isMinimized ? 'pointer-events-auto' : ''}`}>
        <LiveKitRoom
          serverUrl={roomData.livekitUrl}
          token={roomData.token}
          connect={true}
          audio={true}
          video={false}
          onDisconnected={onLeave}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <RoomPanel room={roomData} onLeave={onLeave} />
        </LiveKitRoom>
      </div>
    </div>
  );
}
