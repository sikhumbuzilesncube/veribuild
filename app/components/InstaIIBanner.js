'use client';

import { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#2C3E50] text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F47B20] rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            V
          </div>
          <div>
            <h3 className="font-bold text-sm">Install VeriBuild</h3>
            <p className="text-sm text-gray-300">Get the app for a better experience</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleInstall}
            className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition flex-1 sm:flex-none"
          >
            Install
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-gray-400 hover:text-white transition px-4 py-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
            }
