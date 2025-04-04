import { type HtmlPortalNode } from "react-reverse-portal";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from "react";
import { useOnFullScreenChange } from "hooks/full_screen";
import { isDefined } from "coram-common-utils";
import { FullScreenVideoPanel } from "./FullScreenVideoPanel";

interface FullScreenContextType {
  activeFullScreenVideoId: number | undefined;
  setActiveFullScreenVideoId: (id?: number) => void;
  portalNodes: Map<number, HtmlPortalNode>;
  setPortalNodes: Dispatch<SetStateAction<Map<number, HtmlPortalNode>>>;
  toggleFullScreen: (id: number) => void;
}

const FullScreenContext = createContext<FullScreenContextType | undefined>(
  undefined
);

export function useFullScreenContext() {
  const fullScreenContext = useContext(FullScreenContext);
  if (!isDefined(fullScreenContext)) {
    throw new Error("FullScreenContext is not initialized");
  }

  return fullScreenContext;
}

interface FullScreenProviderProps {
  children: ReactNode;
}

export function FullScreenProvider({ children }: FullScreenProviderProps) {
  const fullscreenPanelRef = useRef<HTMLDivElement>(null);

  const [activeFullScreenVideoId, setActiveFullScreenVideoId] =
    useState<number>();

  const [portalNodes, setPortalNodes] = useState<Map<number, HtmlPortalNode>>(
    new Map()
  );

  // When the fullscreen mode changes, we need to determine whether it is a fullscreen
  // on FullScreenVideoPanel or some other element. For example, in Wall and Live View, we have
  // a fullscreen mode for all videos displayed simultaneously. This change in fullscreen mode is
  // not something FullScreenVideoPanel should react to.
  useOnFullScreenChange(() => {
    const isFullScreen =
      document.fullscreenElement === fullscreenPanelRef.current;
    if (!isFullScreen) {
      setActiveFullScreenVideoId(undefined);
    }
  });

  function toggleFullScreen(videoId: number) {
    const isInFullScreenMode =
      document.fullscreenElement === fullscreenPanelRef.current;

    if (isInFullScreenMode) {
      document.exitFullscreen();
      setActiveFullScreenVideoId(undefined);
    } else {
      fullscreenPanelRef.current?.requestFullscreen();
      setActiveFullScreenVideoId(videoId);
    }
  }

  return (
    <FullScreenContext.Provider
      value={{
        activeFullScreenVideoId,
        setActiveFullScreenVideoId,
        portalNodes,
        setPortalNodes,
        toggleFullScreen,
      }}
    >
      {children}
      <FullScreenVideoPanel ref={fullscreenPanelRef} />
    </FullScreenContext.Provider>
  );
}
