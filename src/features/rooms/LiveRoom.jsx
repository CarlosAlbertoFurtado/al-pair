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
    <div className="flex flex-col h-full">
      {/* Header da sala */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-5 pt-10 pb-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-400">Ao Vivo</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-700/60 rounded-full px-3 py-1">
            <Users size={12} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-300">{participants.length}</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-white mt-2 leading-tight">{room?.roomName}</h2>
        {room?.isHost && (
          <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            <Crown size={10} /> Você é o anfitrião
          </span>
        )}
      </div>

      {/* Participantes - Falantes */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {speakers.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              <Volume2 size={10} className="inline mr-1" />
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
      <div className="px-5 py-4 bg-slate-900/80 backdrop-blur border-t border-slate-800 flex items-center justify-between">
        {room?.isHost ? (
          <TrackToggle
            source={Track.Source.Microphone}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            {isMicrophoneEnabled ? (
              <><Mic size={18} className="text-rose-400" /> Mutar</>
            ) : (
              <><MicOff size={18} className="text-slate-400" /> Ativar mic</>
            )}
          </TrackToggle>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 text-slate-400 text-sm">
            <Volume2 size={18} />
            <span className="font-medium">Ouvindo ao vivo</span>
          </div>
        )}

        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm active:scale-95 transition-all shadow-lg shadow-rose-600/30"
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
  const name = participant.name || participant.identity;
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg transition-all duration-200 ${
        isSpeaking
          ? 'ring-4 ring-rose-400 ring-offset-2 ring-offset-slate-900 bg-gradient-to-tr from-rose-500 to-purple-600 scale-105'
          : 'bg-gradient-to-tr from-slate-600 to-slate-700'
      }`}>
        {initial}
        {isSpeaker && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-slate-900">
            <Mic size={10} className="text-white" />
          </span>
        )}
      </div>
      <p className="text-[10px] text-slate-300 font-semibold text-center truncate w-full max-w-[56px]">
        {name.split(' ')[0]}
      </p>
    </div>
  );
}

// ─── Componente principal (cuida da conexão com o LiveKit) ────────────────────
export default function LiveRoom({ roomData, onLeave }) {
  if (!roomData?.token || !roomData?.livekitUrl) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950 flex flex-col">
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
  );
}
