"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { CDN_URL } from "@/app/constants";
import useIsMobile from "@/app/hooks/MobileOnly";
import FAQFlipCoin from "@/app/components/Faqs/FaqFlipACoin";
import HistoryOfFlipOfCoin from "@/app/components/Histories/HistoryOfFlipOfCoin";
import WorkingOfFlipACoin from "@/app/components/Working/WorkingOfFlipACoin";
import FlipACoinServiceCard from "@/app/components/ServicesCard/FlipACoinServiceCard";
import IntroductionOfFlipOfCoin from "@/app/components/Introductions/IntroductionOfFlipOfCoin";

interface FlipCount {
  heads: number;
  tails: number;
}

export default function CoinFlip() {
  const [isHeads, setIsHeads] = useState<boolean>(true);
  const [flipCount, setFlipCount] = useState<FlipCount>({ heads: 0, tails: 0 });
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();

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
    <div className="flex flex-col flex-1 gap-5 ">
      <div className="flex flex-col justify-center items-center p-2 pt-5 bg-[#212121] text-white ">
        <h1 className="text-4xl md:text-6xl text-center font-extrabold mb-5 page-title">
          Heads or Tails
        </h1>
        <div className="text-lg text-center mb-8">
          Flip a virtual coin with this online and free app. Heads or Tails.
        </div>
        <p className="text-lg font-semibold mb-2">
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
            className="text-4xl"
            style={{
              transform: isHeads ? "rotateY(0deg)" : "rotateX(180deg)",
            }}
          >
            {isHeads ? "HEADS" : "TAILS"}
          </span>
        </motion.div>
        <button
          onClick={handleClick}
          className="mt-4 px-4 py-2 bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={isFlipping}
        >
          Flip the coin!
        </button>

        {/* Audio element */}
        <audio ref={audioRef}>
          <source src={`${CDN_URL}/sounds/coin.mp3`} type="audio/mp3"></source>
        </audio>
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <WorkingOfFlipACoin />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl">
        <IntroductionOfFlipOfCoin />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl">
        <FlipACoinServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <HistoryOfFlipOfCoin />
      </div>
      <FAQFlipCoin />
    </div>
  );
}
