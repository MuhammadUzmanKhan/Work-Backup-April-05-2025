"use client";
import React, { useState, useRef } from "react";
import QRCode from "qrcode.react";
import useIsMobile from "@/app/hooks/MobileOnly";
import toast from "react-hot-toast";
import WorkingOfQRCodeGenerator from "@/app/components/Working/WorkingOfQrCodeGenerator";
import IntroductionOfQRCodeGenerator from "@/app/components/Introductions/IntroductionOfQrCodeGenerator";
import QRCodeGeneratorServiceCard from "@/app/components/ServicesCard/QrCodeGeneratorServiceCard";
import HistoryOfQRCodeGenerator from "@/app/components/Histories/HistoryOfQrCodeGenerator";
import FAQQRCodeGenerator from "@/app/components/Faqs/FaqQrCodeGenerator";

export default function QrCodeGenerator() {
  const [url, setUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (qrRef.current) {
      const qrCanvas = qrRef.current.querySelector("canvas");
      if (qrCanvas) {
        const url = qrCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = "qrcode.png";
        link.click();
        toast.success("QR code downloaded successfully!");
        setIsDownloading(true);
        // Reset downloading state after a delay
        setTimeout(() => {
          setIsDownloading(false);
        }, 3000);
      }
    }
  };

  return (
    <div
      className="p-5 bg-black min-h-screen text-white flex flex-col justify-start items-center"
      style={{ backgroundColor: "#212121" }}
    >
      <div className="text-white flex flex-col justify-start items-center">
        <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
          <span className="page-title">QR Code Generator</span>
        </h1>
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setShowQR(e.target.value.length > 0);
          }}
          placeholder="Enter something to generate QR"
          className="border mt-5 p-2 mb-4 bg-gray-800 text-white border-gray-600 w-full"
        />

        {showQR && (
          <div
            ref={qrRef}
            className="p-5 bg-white rounded flex justify-center items-center"
          >
            <QRCode value={url} size={256} />
          </div>
        )}
        <button
          onClick={handleDownload}
          disabled={!showQR || isDownloading}
          className={`mt-3 p-2 rounded bg-blue-500 text-white ${
            !showQR ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
        >
          {isDownloading ? "Downloading..." : "Download QR Code"}
        </button>
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <WorkingOfQRCodeGenerator />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl">
        <IntroductionOfQRCodeGenerator />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl">
        <QRCodeGeneratorServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <HistoryOfQRCodeGenerator />
      </div>
      <FAQQRCodeGenerator />
    </div>
  );
}
