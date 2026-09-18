import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    const isIosDevice = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIosDevice) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 border border-rose-100 z-50 animate-slide-up flex flex-col gap-3">
      <button onClick={handleClose} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full">
        <X size={18} />
      </button>
      
      <div className="flex items-center gap-3">
        <img src="/pwa-192x192.png" alt="AuPairConnect" className="w-12 h-12 rounded-xl object-cover" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 leading-tight">AuPairConnect</h3>
          <p className="text-sm text-gray-500">Instale o app oficial</p>
        </div>
      </div>
      
      {isIOS ? (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
          Para instalar no iPhone: toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima) na barra inferior e depois em <strong>Adicionar à Tela de Início</strong>.
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className="w-full bg-rose-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-600 active:bg-rose-700 transition-colors"
        >
          <Download size={18} />
          Instalar Aplicativo
        </button>
      )}
    </div>
  );
}
