"use client";

import React, { useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { BsImageFill } from "react-icons/bs";
import { FiCopy } from "react-icons/fi";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function QRCodeScanner() {
  const [qrCodeData, setQRCodeData] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setIsLoading(true);
    setError("");
    setImagePreview(URL.createObjectURL(file));
    setFileName(file.name);

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      setQRCodeData(result.data);
    } catch (err) {
      setError("No QR code found in the image.");
    } finally {
      setIsLoading(false);
    }
  };

  const openBrowseImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCodeData).then(
      () => toast.success("QR Code data copied to clipboard"),
      () => toast.error("Failed to copy QR Code data to clipboard")
    );
  };

  return (
    <div
      className="min-h-[90vh] flex flex-col items-center justify-start p-5 bg-black text-white"
      style={{ backgroundColor: "#212121" }}
    >
      <h1 className="text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
        <span className="page-title pb-5">QR Code Scanner</span>
      </h1>
      <input
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
      />
      <div
        onClick={openBrowseImage}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileChange(e.dataTransfer.files?.[0] || null);
        }}
        className="relative w-full min-h-[30vh] md:min-h-[50vh] p-5 bg-[#202020] cursor-pointer rounded-xl flex items-center justify-center border border-gray-600"
      >
        {imagePreview ? (
          <div className="flex flex-col items-center">
            <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px]">
              <Image
                src={imagePreview}
                alt="Preview"
                layout="fill"
                objectFit="contain"
                className="rounded-xl"
              />
            </div>
            <p className="text-lg md:text-xl text-center px-5 pt-5 font-[400]">
              {fileName}
            </p>
            <p className="text-2xl md:text-2xl text-center px-5 pt-5 font-[200]">
              Click here to replace Image
            </p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-3">
            <p className="text-2xl md:text-3xl text-center text-[#707070] font-[800]">
              {isLoading
                ? "Processing Image..."
                : "Browse Or Drop Your Image Here to Scan QR"}
            </p>
            <span className="text-8xl md:text-[150px] block text-[#5f5f5f]">
              <BsImageFill className={isLoading ? "animate-pulse" : ""} />
            </span>
          </div>
        )}
      </div>
      {isLoading && <p className="mt-4 text-yellow-500">Scanning...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {qrCodeData && (
        <div className="mt-5 p-5 bg-gray-800 rounded-lg text-center w-full md:w-2/3 lg:w-1/2 flex flex-col items-center">
          <p className="text-xl">QR Code Data:</p>
          <div className="flex flex-row justify-between items-center w-full">
            <p className="text-lg mt-2 break-words">{qrCodeData}</p>
            <button
              onClick={copyToClipboard}
              className="ml-3 p-1 rounded bg-blue-500 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiCopy />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
