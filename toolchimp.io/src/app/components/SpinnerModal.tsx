import React, { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import useIsMobile from "../hooks/MobileOnly";
import { CDN_URL } from "../constants";

interface SpinnerModalProps {
  open: boolean;
  onClose: () => void;
  winner: string;
}

export function SpinnerModal({ open, onClose, winner }: SpinnerModalProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [showConfetti, setShowConfetti] = useState(false);
  const isMobile = useIsMobile();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsOpen(open);
    if (open) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);

      const playAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error("Audio playback failed:", error);
          });
        }
      };

      if (audioRef.current) {
        audioRef.current.addEventListener("canplaythrough", playAudio, {
          once: true,
        });
        audioRef.current.load();
      }
    }
  }, [open]);

  const closeModal = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <div
            className={`relative bg-white rounded-lg p-8 max-w-lg ${
              isMobile ? "w-3/4" : "w-full"
            }`}
          >
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Modal Content Here */}
            <div className="flex flex-row justify-start gap-2 items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Congratulations!
              </h2>
              <h3 className="text-red-500">{winner}</h3>
            </div>

            <p className="text-gray-500"> Claim your prize now!</p>
            <div className="mt-4">
              <button
                onClick={closeModal}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Audio element */}
      <audio ref={audioRef}>
        <source src={`${CDN_URL}/sounds/claps.mp3`} type="audio/mp3" />
      </audio>
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}
    </>
  );
}
