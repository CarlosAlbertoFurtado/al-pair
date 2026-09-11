import { CalendarClock, Headphones, MessageCircle, ShieldCheck } from 'lucide-react';

export default function AudioRooms() {
  return (
    <div className="min-h-full bg-slate-50 p-4">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Headphones size={30} />
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-indigo-500">Em breve</p>
        <h2 className="mt-2 text-xl font-black text-slate-900">Salas de audio ao vivo</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Estamos preparando essa experiencia com voz real, moderacao e seguranca para a comunidade.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4">
          <MessageCircle className="text-rose-500" size={20} />
          <div>
            <p className="text-sm font-bold text-slate-800">Beta focada em comunidade</p>
            <p className="text-xs text-slate-500">Perfil, feed, busca, seguidores e chat vem primeiro.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4">
          <ShieldCheck className="text-emerald-500" size={20} />
          <div>
            <p className="text-sm font-bold text-slate-800">Antes de abrir voz ao vivo</p>
            <p className="text-xs text-slate-500">Vamos fechar moderacao, denuncia, bloqueio e regras de uso.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4">
          <CalendarClock className="text-indigo-500" size={20} />
          <div>
            <p className="text-sm font-bold text-slate-800">Proxima fase</p>
            <p className="text-xs text-slate-500">Daily, Agora ou LiveKit serao avaliados depois da beta.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
