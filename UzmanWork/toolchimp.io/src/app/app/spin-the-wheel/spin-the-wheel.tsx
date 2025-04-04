"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AiOutlineLeft, AiOutlineLoading3Quarters } from "react-icons/ai";
import { SpinnerModal } from "../../components/SpinnerModal";
import useIsMobile from "@/app/hooks/MobileOnly";

const WheelComponent = dynamic(() => import("../../components/Wheel"), {
  loading: () => <></>,
  ssr: false,
});

export default function Spinner() {
  const [canvasId, setCanvasId] = useState("");
  const [wheelId, setWheelId] = useState("");
  const [openSpinnerModal, setOpenSpinnerModal] = useState<boolean>(false);

  const [inputValue, setInputValue] = useState<string>(
    "Smith\nJohnson\nEmily\nJames\nMiller\nDavid Wood"
  );
  const [names, setNames] = useState<string[]>(inputValue.split("\n"));
  const [isLoading, setIsLoading] = useState(true);
  const [winner, setWinner] = useState<string>("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const randomString = () => {
      const chars =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".split(
          ""
        );
      const length = 8;
      let str = "";
      for (let i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      return str;
    };
    setCanvasId(`canvas-${randomString()}`);
    setWheelId(`wheel-${randomString()}`);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Monitor changes in isMobile and reload page
  useEffect(() => {
    const handleResize = () => {
      window.location.reload();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setNames(value.split("\n").filter((name) => name.trim() !== ""));
  };

  const segColors = names.map((_, index) => {
    const colors = [
      "#607D8B",
      "#9C27B0",
      "#4CAF50",
      "#FF5722",
      "#795548",
      "#FFEB3B",
    ];
    return colors[index % colors.length];
  });

  const onFinished = (winner: string) => {
    console.log(winner);
    setOpenSpinnerModal(true);
    setWinner(winner);
  };

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
      style={{ backgroundColor: "#212121" }}
    >
      <h1 className="text-white text-2xl md:text-6xl text-start px-5 font-[800]">
        <span className="page-title">Spinner</span>
      </h1>
      <div className="flex flex-row justify-center items-center">
        <div>
          {!!canvasId && !!wheelId && (
            <div
              className={`flex flex-row justify-center items-center ${
                isMobile ? "flex-wrap" : ""
              }`}
            >
              <WheelComponent
                key={`${canvasId}-${wheelId}-${names.join(",")}`}
                segments={names}
                segColors={segColors}
                winningSegment="MM"
                onFinished={onFinished}
                primaryColor="black"
                contrastColor="white"
                buttonText="Start"
                isOnlyOnce={false}
                size={isMobile ? 190 : 300}
                upDuration={500}
                downDuration={600}
                fontFamily="Helvetica"
                canvasId={canvasId}
                wheelId={wheelId}
              />
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <AiOutlineLoading3Quarters className="animate-spin text-white text-8xl" />
                </div>
              ) : isMobile ? (
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  className={`${
                    isMobile ? "w-1/2 h-64" : "w-full h-96"
                  } p-4 bg-gray-800 border border-gray-700 rounded-lg text-white overflow-y-auto shadow-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out`}
                  placeholder="Enter names here..."
                />
              ) : (
                <div className="flex flex-row items-center">
                  <div className="rounded-full bg-gray-500 p-2">
                    <AiOutlineLeft className="text-white text-8xl mx-4" />
                  </div>
                  <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`${
                      isMobile ? "w-1/2 h-64" : "w-full h-96"
                    } p-4 bg-gray-800 border border-gray-700 rounded-lg text-white overflow-y-auto shadow-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out`}
                    placeholder="Enter names here..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <SpinnerModal
          open={openSpinnerModal}
          onClose={() => setOpenSpinnerModal(false)}
          winner={winner}
        />
      </div>
    </div>
  );
}
