import { useState } from 'react';
import { Gift, Copy, CheckCircle, Share2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReferralScreen() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const referralCode = "AUPAIR-VIP-2026";
  const referralLink = `https://aupairconnect.app/invite?code=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AuPairConnect',
          text: 'Use meu código e ganhe 1 mês de Premium grátis no AuPairConnect!',
          url: referralLink,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-rose-100 z-30 sticky top-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-rose-50 text-slate-700 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Indique e Ganhe</h1>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-rose-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Gift size={48} className="text-rose-500" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Convide amigas e ganhe Premium!</h2>
        <p className="text-slate-500 text-center mb-8 px-4 text-sm leading-relaxed">
          Para cada amiga que se cadastrar com o seu link, você ganha 1 mês de AuPairConnect Premium grátis e ela também!
        </p>

        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seu Link de Indicação</p>
          <div className="flex items-center gap-2 bg-slate-50 p-1 pl-4 rounded-xl border border-slate-200">
            <span className="flex-1 text-sm text-slate-600 font-medium truncate select-all">{referralLink}</span>
            <button 
              onClick={handleCopy}
              className={`p-3 rounded-lg transition-all active:scale-95 flex items-center justify-center min-w-[48px] ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-rose-200"
        >
          <Share2 size={20} />
          <span>Compartilhar Link</span>
        </button>
      </div>
    </div>
  );
}
