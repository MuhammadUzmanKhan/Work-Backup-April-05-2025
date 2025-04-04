import { BrowserRouter } from 'react-router-dom';
import './App.scss';
import Pages from "./pages";
import { useEffect, useState } from 'react';

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event); // Save the event so it can be triggered later
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  return (
    <div className="main">
      <BrowserRouter>
        <Pages deferredPrompt={deferredPrompt} />
      </BrowserRouter>
    </div>
  );
}

export default App;
