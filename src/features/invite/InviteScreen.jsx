import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Gift, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function InviteScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    const code = encodeURIComponent((user?.id || user?.email || 'aupair').slice(0, 10));
    return `${window.location.origin}/login?ref=${code}`;
  }, [user?.email, user?.id]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const shareInvite = async () => {
    const shareData = {
      title: 'AuPairConnect',
      text: 'Vem para o AuPairConnect comigo.',
      url: inviteUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    copyInvite();
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Vem para o AuPairConnect comigo: ${inviteUrl}`);
    window.location.href = `https://wa.me/?text=${text}`;
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-white/90 px-4 py-3 backdrop-blur-md border-b border-rose-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-700 hover:bg-rose-50 active:scale-95">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black">Indique e Ganhe</h1>
          <p className="text-xs text-slate-500">Convide pessoas reais para sua rede</p>
        </div>
      </div>

      <div className="px-5 pb-8">
        <div className="pt-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-rose-100 to-purple-100 shadow-xl shadow-rose-200">
            <Gift size={42} className="text-rose-500" />
          </div>
          <h2 className="mt-6 text-2xl font-black">Cresça sua comunidade</h2>
          <p className="mx-auto mt-2 max-w-[300px] text-sm leading-relaxed text-slate-500">
            Compartilhe seu convite com au pairs, ex au pairs e famílias. Quanto mais conexões reais, melhor o radar e o feed ficam para todo mundo.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Seu link</p>
          <div className="mt-2 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 break-all">
            {inviteUrl}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={copyInvite}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black active:scale-95 transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={shareInvite}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-sm font-black text-white active:scale-95 shadow-lg shadow-rose-200"
            >
              <Share2 size={18} />
              Compartilhar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={openWhatsApp}
            className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-left active:scale-[0.99] hover:bg-green-50 transition-colors"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-green-700">Enviar pelo WhatsApp</p>
              <p className="text-xs text-green-600/80">Abre o compartilhamento direto no celular.</p>
            </div>
          </button>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 mt-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <Sparkles size={18} />
              <p className="text-sm font-black">Créditos e recompensas</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-yellow-700/80">
              Nesta fase beta, seus convites ficam registrados pelo link. Quando o programa de créditos for ativado, esses convites poderão virar benefícios dentro do app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
