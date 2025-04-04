"use client";
import React, { useState, useRef } from "react";
import QRCode from "qrcode.react";
import useIsMobile from "@/app/hooks/MobileOnly";
import toast from "react-hot-toast";

export default function QrCodeGenerator() {
  const [url, setUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
      }
    }
  };

  return (
    <div
      className="p-5 bg-black min-h-screen text-white flex flex-col justify-start items-center"
      style={{ backgroundColor: "#212121" }}
    >
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
        className={`border mt-5 p-2 mb-4 bg-gray-800 text-white border-gray-600 ${
          isMobile ? "w-full" : "w-1/2"
        }`}
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
        disabled={!showQR}
        className={`mt-3 p-2 rounded bg-blue-500 text-white ${
          !showQR ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        Download QR Code
      </button>
    </div>
  );
}
