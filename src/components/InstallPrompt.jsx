import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /ipad|iphone|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!closed) setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Sempre tentar mostrar o card para mobile após 2s se não estiver instalado
    if (isIosDevice || isAndroidDevice) {
      const timer = setTimeout(() => {
        if (!closed) setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [closed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setClosed(true);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
    setClosed(true);
  };

  if (isStandalone || !showPrompt || closed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 border border-slate-100 z-[100] animate-in slide-in-from-bottom duration-300 flex flex-col gap-4">
      <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full active:scale-90 transition-transform">
        <X size={18} />
      </button>
      
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-2xl p-[2px] shadow-lg shadow-rose-200">
          <img src="/icon-192.png" alt="AuPairConnect" className="w-full h-full rounded-[14px] object-cover bg-white" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-black text-slate-900 text-lg leading-tight">AuPairConnect</h3>
          <p className="text-sm font-medium text-slate-500">App oficial da comunidade</p>
        </div>
      </div>
      
      {isIOS && (
        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          Para instalar no iPhone: toque no ícone de <strong>Compartilhar</strong> <span className="inline-block px-1 bg-white border rounded shadow-sm text-xs">➦</span> na barra do Safari e depois em <strong>Adicionar à Tela de Início</strong>.
        </div>
      )}
      
      {!isIOS && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-rose-500/30"
        >
          <Download size={20} />
          Instalar App Agora
        </button>
      )}

      {!isIOS && !deferredPrompt && isAndroid && (
        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          Para instalar no Android: toque nos <strong>três pontinhos</strong> (menu) do navegador e selecione <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.
        </div>
      )}
    </div>
  );
}
