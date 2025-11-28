import { useState, useEffect } from 'react';

function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt for reuse
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
        <button
          onClick={handleInstallClick}
          className="font-semibold hover:text-indigo-100 transition-colors"
        >
          📱 Install Aplikasi
        </button>
        <button
          onClick={() => setShowInstallButton(false)}
          className="text-white hover:text-indigo-200 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default InstallPWA;
