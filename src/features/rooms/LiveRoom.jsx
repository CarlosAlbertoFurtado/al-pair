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
import { Mic, MicOff, LogOut, Crown, Users, Volume2, MessageSquare, Hand, X, Send, ChevronDown, Maximize2, Check } from 'lucide-react';
import { useAudioRoomStore } from '../../store/useAudioRoomStore';
import { resolveAssetUrl, roomsAPI } from '../../api';

// ─── Chat da Sala ─────────────────────────────────────────────────────────────
function RoomChat({ onClose }) {
  const { send, chatMessages } = useChat();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      send(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="font-black text-slate-900 flex items-center gap-2">
          <MessageSquare size={18} className="text-rose-500" /> Chat ao Vivo
        </h3>
        <button onClick={onClose} className="p-2 rounded-full bg-slate-200 text-slate-600 active:scale-95">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={scrollRef}>
        {chatMessages.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 mb-1">{msg.from?.name || 'Alguém'}</span>
            <div className="bg-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-700 w-fit max-w-[85%]">
              {msg.message}
            </div>
          </div>
        ))}
        {chatMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Escreva algo..."
          className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="w-11 h-11 bg-rose-500 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
        >
          <Send size={16} className="-ml-1" />
        </button>
      </form>
    </div>
  );
}

// ─── Painel interno da sala (roda dentro do contexto LiveKitRoom) ─────────────
function RoomPanel({ room, onLeave }) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [showChat, setShowChat] = useState(false);
  const { isMinimized, setMinimized } = useAudioRoomStore();
  
  // Levantar a mão (DataChannel)
  const { send: sendHandRaise, message: handRaiseMsg } = useDataChannel('hand-raise');
  const [raisedHands, setRaisedHands] = useState([]);

  useEffect(() => {
    if (handRaiseMsg) {
      const payload = new TextDecoder().decode(handRaiseMsg.payload);
      if (payload === 'RAISE_HAND') {
        const fromId = handRaiseMsg.from?.identity;
        if (fromId && !raisedHands.includes(fromId)) {
          setRaisedHands(prev => [...prev, fromId]);
        }
      }
    }
  }, [handRaiseMsg]);

  // Ativa o microfone automaticamente se for host ou speaker
  useEffect(() => {
    if (localParticipant?.permissions?.canPublish && localParticipant) {
      localParticipant.setMicrophoneEnabled(true).catch(console.warn);
    }
  }, [localParticipant?.permissions?.canPublish, localParticipant]);

  const speakers = participants.filter(p => p.permissions?.canPublish);
  const listeners = participants.filter(p => !p.permissions?.canPublish);
  const amISpeaker = localParticipant?.permissions?.canPublish;

  const handleApproveSpeaker = async (participantId) => {
    try {
      await roomsAPI.approveSpeaker(room.roomId, participantId);
      // Remove da lista de mãos levantadas
      setRaisedHands(prev => prev.filter(id => id !== participantId));
    } catch (err) {
      alert('Erro ao aprovar participante.');
    }
  };

  // Renderização Mini-Player
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between z-[100] animate-in slide-in-from-bottom">
        <RoomAudioRenderer />
        <div className="flex flex-col flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Ao Vivo</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 truncate">{room?.roomName}</h3>
        </div>
        <div className="flex items-center gap-2">
          {amISpeaker && (
            <TrackToggle
              source={Track.Source.Microphone}
              className="p-2.5 rounded-full bg-slate-100 text-slate-700 active:scale-95"
            >
              {isMicrophoneEnabled ? <Mic size={18} className="text-rose-500" /> : <MicOff size={18} />}
            </TrackToggle>
          )}
          <button onClick={() => setMinimized(false)} className="p-2.5 rounded-full bg-rose-500 text-white shadow-lg active:scale-95">
            <Maximize2 size={18} />
          </button>
          <button onClick={onLeave} className="p-2.5 rounded-full bg-slate-800 text-white active:scale-95">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Renderização Full-Screen
  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header da sala */}
      <div className="bg-white/70 backdrop-blur-xl px-5 pt-10 pb-6 border-b border-slate-200/50 shadow-sm z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">Ao Vivo</span>
            <div className="flex items-center gap-1 bg-slate-100/50 rounded-full px-2 py-0.5 border border-slate-200/50 ml-2">
              <Users size={10} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-700">{participants.length}</span>
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 leading-tight">{room?.roomName}</h2>
        </div>
        <button onClick={() => setMinimized(true)} className="p-2 bg-white/50 rounded-full text-slate-600 active:scale-95 border border-slate-200">
          <ChevronDown size={24} />
        </button>
      </div>

      {/* Participantes */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 relative">
        {speakers.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 drop-shadow-sm">
              🎙️ Palestrantes ({speakers.length}/8)
            </p>
            <div className="grid grid-cols-3 gap-4">
              {speakers.map(p => (
                <ParticipantCard key={p.identity} participant={p} isSpeaker />
              ))}
            </div>
          </div>
        )}

        {listeners.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 drop-shadow-sm mt-8">
              <Volume2 size={10} className="inline mr-1 text-slate-500" />
              OUVINTES ({listeners.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {listeners.map(p => {
                const isHandRaised = raisedHands.includes(p.identity);
                return (
                  <div key={p.identity} className="relative group cursor-pointer" onClick={() => {
                    if (room?.isHost && isHandRaised) handleApproveSpeaker(p.identity);
                  }}>
                    <ParticipantCard participant={p} isSpeaker={false} />
                    {isHandRaised && (
                      <div className="absolute -top-1 -right-1 flex flex-col gap-1 z-20">
                        <span className="bg-amber-400 p-1 rounded-full animate-bounce shadow-md">
                          <Hand size={12} className="text-white" />
                        </span>
                        {room?.isHost && (
                          <div className="absolute top-6 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            Aprovar
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

      {/* Chat Overlay */}
      {showChat && <RoomChat onClose={() => setShowChat(false)} />}

      {/* Barra de controles inferior */}
      <div className="px-5 py-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 flex items-center justify-between shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="flex items-center gap-3">
          {amISpeaker ? (
            <TrackToggle
              source={Track.Source.Microphone}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-700 font-bold active:scale-95 transition-transform border border-slate-200 shadow-sm"
            >
              {isMicrophoneEnabled ? <Mic size={20} className="text-rose-500" /> : <MicOff size={20} className="text-slate-400" />}
            </TrackToggle>
          ) : (
            <button
              onClick={() => sendHandRaise(new TextEncoder().encode('RAISE_HAND'), { reliable: true })}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 font-bold active:scale-95 transition-transform border border-indigo-100 shadow-sm"
            >
              <Hand size={20} />
            </button>
          )}

          <button
            onClick={() => setShowChat(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-600 active:scale-95 transition-transform border border-slate-200 shadow-sm"
          >
            <MessageSquare size={20} />
          </button>
        </div>

        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-rose-500/30"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );
}

// ─── Card de participante ─────────────────────────────────────────────────────
function ParticipantCard({ participant, isSpeaker }) {
  const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: false });
  const audioTrack = tracks.find(t => t.participant.identity === participant.identity);
  const isSpeaking = audioTrack?.participant?.isSpeaking ?? false;
  
  // Extrai avatar do metadata injetado pelo backend
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
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg transition-all duration-200 shadow-lg bg-cover bg-center ${
        isSpeaking
          ? 'ring-4 ring-rose-400 ring-offset-2 ring-offset-white/50 scale-105 shadow-rose-500/50'
          : 'border-2 border-white'
      } ${!avatarUrl && 'bg-gradient-to-tr from-slate-300 to-slate-400'}`}
      style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
      >
        {!avatarUrl && initial}
        {isSpeaker && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Mic size={10} className="text-white" />
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-800 font-black text-center truncate w-full max-w-[56px] drop-shadow-md">
        {name.split(' ')[0]}
      </p>
    </div>
  );
}

const ROOM_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1496442226666-8d4d0e2815cb?auto=format&fit=crop&q=80&w=1000',
];

// ─── Componente principal (cuida da conexão com o LiveKit) ────────────────────
export default function LiveRoom({ roomData, onLeave }) {
  const { isMinimized } = useAudioRoomStore();
  if (!roomData?.token || !roomData?.livekitUrl) return null;

  const bgIndex = roomData.roomId ? roomData.roomId.charCodeAt(0) % ROOM_BACKGROUNDS.length : 0;
  const backgroundUrl = ROOM_BACKGROUNDS[bgIndex];

  return (
    <div className={`fixed z-[90] flex flex-col transition-all duration-300 ${isMinimized ? 'inset-x-0 bottom-0 top-auto h-0 bg-transparent' : 'inset-0 bg-slate-100'}`}>
      {!isMinimized && (
        <>
          <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundUrl}')` }} />
          <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-2xl" />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/90 via-white/50 to-slate-100/95" />
        </>
      )}
      
      <div className={`relative z-10 flex-1 flex flex-col ${isMinimized ? 'overflow-visible' : ''}`}>
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
