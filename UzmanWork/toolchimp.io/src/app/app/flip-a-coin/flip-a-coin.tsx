"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

interface FlipCount {
  heads: number;
  tails: number;
}

export default function CoinFlip() {
  const [isHeads, setIsHeads] = useState<boolean>(true);
  const [flipCount, setFlipCount] = useState<FlipCount>({ heads: 0, tails: 0 });
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    const flipDuration = 2000;
    const flipInterval = 100;
    let flipTime = 0;

    // Play the sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset audio to the beginning
      audioRef.current
        .play()
        .catch((error) => console.log("Audio playback error:", error));
    }

    const flipIntervalId = setInterval(() => {
      setIsHeads((prev) => !prev);
      flipTime += flipInterval;

      if (flipTime >= flipDuration) {
        clearInterval(flipIntervalId);
        setIsFlipping(false);
        const finalFlip = Math.random() > 0.5;
        setIsHeads(finalFlip);

        setFlipCount((prev) => ({
          ...prev,
          heads: prev.heads + (finalFlip ? 1 : 0),
          tails: prev.tails + (!finalFlip ? 1 : 0),
        }));
      }
    }, flipInterval);
  };

  return (
    <>
      <div
        className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
        style={{ backgroundColor: "#212121" }}
      >
        <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
          <span className="page-title">Flip a coin</span>
        </h1>
        <p className="mb-2 text-white text-lg font-semibold">
          Heads: {flipCount.heads} Tails: {flipCount.tails}
        </p>
        <motion.div
          onClick={handleClick}
          className={`w-64 h-64 rounded-full flex items-center justify-center cursor-pointer relative ${
            isHeads ? "bg-pink-500" : "bg-black"
          }`}
          animate={{ rotateX: isHeads ? 0 : 180 }}
          transition={{ duration: 0.1 }}
        >
          <div className="absolute inset-0 border-4 border-dotted border-white rounded-full"></div>
          <span
            className="text-white text-4xl z-10"
            style={{ transform: isHeads ? "rotateY(0deg)" : "rotateX(180deg)" }}
          >
            {isHeads ? "HEADS" : "TAILS"}
          </span>
        </motion.div>

        <button
          onClick={handleClick}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          disabled={isFlipping}
        >
          Flip the coin!
        </button>

        {/* Audio element */}
        <audio ref={audioRef}>
          <source src="/sounds/coin.mp3" type="audio/mp3"></source>
        </audio>
      </div>
    </>
  );
}
