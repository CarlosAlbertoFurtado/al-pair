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
    <div className="min-h-full bg-slate-950 text-white">
      <div className="sticky top-0 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-300 hover:bg-white/10 active:scale-95">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-black">Indique e Ganhe</h1>
          <p className="text-xs text-slate-400">Convide pessoas reais para sua rede</p>
        </div>
      </div>

      <div className="px-5 pb-8">
        <div className="pt-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/20">
            <Gift size={42} />
          </div>
          <h2 className="mt-6 text-2xl font-black">Cresça sua comunidade</h2>
          <p className="mx-auto mt-2 max-w-[300px] text-sm leading-relaxed text-slate-400">
            Compartilhe seu convite com au pairs, ex au pairs e famílias. Quanto mais conexões reais, melhor o radar e o feed ficam para todo mundo.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Seu link</p>
          <div className="mt-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 break-all">
            {inviteUrl}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={copyInvite}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-slate-900 active:scale-95"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={shareInvite}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-black text-white active:scale-95"
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
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-left active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">Enviar pelo WhatsApp</p>
              <p className="text-xs text-emerald-200/80">Abre o compartilhamento direto no celular.</p>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles size={18} />
              <p className="text-sm font-black">Créditos e recompensas</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Nesta fase beta, seus convites ficam registrados pelo link. Quando o programa de créditos for ativado, esses convites poderão virar benefícios dentro do app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
