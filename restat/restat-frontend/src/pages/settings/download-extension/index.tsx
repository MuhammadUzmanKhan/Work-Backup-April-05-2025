import { FC, useEffect, useState } from "react";
import { images } from "../../../assets";
import { SettingsProps } from "../../../services/types/setting-prop-types";
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DownloadExtension: FC<SettingsProps> = ({ deferredPrompt }) => {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const handlePWAInstall = () => {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt();
    }
  };

  useEffect(() => {
    const checkPWAInstalled = () => {
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      setIsPWAInstalled(isIOSStandalone || isStandalone);
    };

    checkPWAInstalled();

    window.addEventListener('resize', checkPWAInstalled);
    return () => window.removeEventListener('resize', checkPWAInstalled);
  }, []);

  return (
    <div className='Integrations'>
      <h2>Download Extension</h2>
      <p className='description'>Please click on the following tiles to download an extension for your favourite browser and extend the abilities & productivity of your business development team.</p>
      <div className="flex">
        <button
          className={`button-integration d-flex g-2`}
          type='button'
          onClick={() => window.open(process.env.REACT_APP_EXTENSION_URL, '_blank')}
          style={{ minWidth: "20%" }}
        >
          <img src={images.logoIcon} width={30} alt={"Restat extension link"} />
          <b>Restat Extention</b>
        </button>
        {deferredPrompt ? (
          <button
            className={`button-integration d-flex g-2`}
            onClick={handlePWAInstall}
            style={{ minWidth: "20%" }}
          >
            <img src={images.logoIcon} width={30} alt={"Restat PWA link"} />
            {
              !isPWAInstalled ? <b>Install Restat PWA</b> : <b>Restat PWA is <span style={{ color: "green" }}>Installed</span></b>
            }
          </button>
        ) :
          (
            <button
              className={`button-integration d-flex g-2`}
              onClick={handlePWAInstall}
              style={{ minWidth: "20%" }}
            >
              <img src={images.logoIcon} width={30} alt={"Restat PWA link"} />
              <b>Restat PWA is <span style={{ color: "green" }}>Installed</span></b>
            </button>
          )}
      </div>
    </div>
  )
}

export default DownloadExtension;
