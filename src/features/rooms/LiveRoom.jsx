import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTracks,
  TrackToggle,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { Mic, MicOff, LogOut, Crown, Users, Volume2 } from 'lucide-react';

// ─── Painel interno da sala (roda dentro do contexto LiveKitRoom) ─────────────
function RoomPanel({ room, onLeave }) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  // Ativa o microfone automaticamente se for host
  useEffect(() => {
    if (room?.isHost && localParticipant) {
      localParticipant.setMicrophoneEnabled(true).catch(console.warn);
    }
  }, [room?.isHost, localParticipant]);

  const speakers = participants.filter(p => p.permissions?.canPublish);
  const listeners = participants.filter(p => !p.permissions?.canPublish);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header da sala */}
      <div className="bg-white/70 backdrop-blur-xl px-5 pt-10 pb-6 border-b border-slate-200/50 shadow-sm z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">Ao Vivo</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/50 rounded-full px-3 py-1 border border-slate-200/50">
            <Users size={12} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700">{participants.length}</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 mt-2 leading-tight">{room?.roomName}</h2>
        {room?.isHost && (
          <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-amber-600 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/50">
            <Crown size={10} /> Você é o anfitrião
          </span>
        )}
      </div>

      {/* Participantes - Falantes */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {speakers.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 drop-shadow-sm">
              🎙️ Palestrantes ({speakers.length})
            </p>
            <div className="grid grid-cols-3 gap-4">
              {speakers.map(p => (
                <ParticipantCard key={p.identity} participant={p} isSpeaker />
              ))}
            </div>
          </div>
        )}

        {/* Ouvintes */}
        {listeners.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 drop-shadow-sm">
              <Volume2 size={10} className="inline mr-1 text-slate-500" />
              OUVINTES ({listeners.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {listeners.map(p => (
                <ParticipantCard key={p.identity} participant={p} isSpeaker={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Renderiza o áudio de todos os participantes (invisível, mas necessário!) */}
      <RoomAudioRenderer />

      {/* Barra de controles */}
      <div className="px-5 py-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 flex items-center justify-between shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.05)] z-10">
        {room?.isHost ? (
          <TrackToggle
            source={Track.Source.Microphone}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-slate-700 font-bold text-sm active:scale-95 transition-transform border border-slate-200 shadow-sm"
          >
            {isMicrophoneEnabled ? (
              <><Mic size={18} className="text-rose-500" /> Mutar</>
            ) : (
              <><MicOff size={18} className="text-slate-400" /> Ativar mic</>
            )}
          </TrackToggle>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-slate-500 text-sm border border-slate-200 shadow-sm">
            <Volume2 size={18} />
            <span className="font-medium">Ouvindo ao vivo</span>
          </div>
        )}

        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-rose-500/30"
        >
          <LogOut size={18} />
          Sair da Sala
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
  const name = participant.name || participant.identity;
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg transition-all duration-200 shadow-lg ${
        isSpeaking
          ? 'ring-4 ring-rose-400 ring-offset-2 ring-offset-white/50 bg-gradient-to-tr from-rose-400 to-purple-500 scale-105 shadow-rose-500/50'
          : 'bg-gradient-to-tr from-slate-300 to-slate-400 border-2 border-white'
      }`}>
        {initial}
        {isSpeaker && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Mic size={10} className="text-white" />
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-700 font-black text-center truncate w-full max-w-[56px] drop-shadow-md">
        {name.split(' ')[0]}
      </p>
    </div>
  );
}

const ROOM_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000', // Travel Landscape
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000', // Map/Compass
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1000', // Airplane wing
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?auto=format&fit=crop&q=80&w=1000', // Passport/Coffee
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=1000', // Paris
  'https://images.unsplash.com/photo-1496442226666-8d4d0e2815cb?auto=format&fit=crop&q=80&w=1000', // New York
];

// ─── Componente principal (cuida da conexão com o LiveKit) ────────────────────
export default function LiveRoom({ roomData, onLeave }) {
  if (!roomData?.token || !roomData?.livekitUrl) return null;

  // Seleciona um fundo aleatório baseado no ID da sala para ser consistente
  const bgIndex = roomData.roomId ? roomData.roomId.charCodeAt(0) % ROOM_BACKGROUNDS.length : 0;
  const backgroundUrl = ROOM_BACKGROUNDS[bgIndex];

  return (
    <div className="fixed inset-0 z-[90] bg-slate-100 flex flex-col">
      {/* Background Image Setup */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundUrl}')` }}
      />
      <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-2xl" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/90 via-white/50 to-slate-100/95" />
      
      {/* LiveKit Room */}
      <div className="relative z-10 flex-1 flex flex-col">
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
