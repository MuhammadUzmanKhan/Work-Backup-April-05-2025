"use client";
import React, { useState, KeyboardEvent } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import Image from "next/image";
import { fbFormatDuration } from "@/app/utils/globals";
import WorkingOfFacebookDownloader from "@/app/components/Working/WorkingOfFacebookDowloader";
import IntroductionOfFacebookDownloader from "@/app/components/Introductions/IntroductionOfFacebookDownloader";
import FacebookDownloaderServiceCard from "@/app/components/ServicesCard/FacebookDownloaderServiceCard";
import HistoryOfFacebookDownloader from "@/app/components/Histories/HistoryOfFacebookDownloader";
import useIsMobile from "@/app/hooks/MobileOnly";
import FAQFacebookDownloader from "@/app/components/Faqs/FaqFacebookVideoDownloader";

export default function FacebookVideoDownloader() {
  const [url, setUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const isValidUrl = (url: string) => {
    return url.includes("https://www.facebook.com/");
  };
  const getVideoInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/getFbVideoInfo?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch video info");
      }
      const info = await response.json();
      setVideoInfo(info);
    } catch (error: any) {
      setError("Error fetching video info: " + error.message);
    }
    setLoading(false);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isValidUrl(url)) {
        getVideoInfo();
      } else {
        setError("Enter Valid URL Facebook Here");
      }
    }
  };

  const downloadVideo = async (quality: "hd") => {
    if (videoInfo && videoInfo[quality]) {
      try {
        setDownloading(true);
        const response = await fetch(videoInfo[quality]);
        const blob = await response.blob();
        saveAs(blob, `${videoInfo.title}.mp4`);
        toast.success("Downloaded successfully");
      } catch (error: any) {
        setError("Error downloading video: " + error.message);
      } finally {
        setDownloading(false);
      }
    }
  };

  return (
    <div
      className="p-5 bg-black min-h-screen text-white flex flex-col justify-start items-center"
      style={{ backgroundColor: "#212121" }}
    >
      <div className="shadow-2xl mb-10">
        <h1 className="text-4xl md:text-6xl text-center font-extrabold mb-5 page-title pt-6">
          Facebook Video Downloader
        </h1>
        <label className="block mb-2">
          Enter Facebook Video URL to download in mp4:
          <input
            type="text"
            value={url}
            onKeyDown={handleKeyPress}
            onChange={(e) => setUrl(e.target.value)}
            className="border p-2 w-full mb-4 bg-gray-800 text-white border-gray-600"
          />
        </label>
        <button
          onClick={getVideoInfo}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Video Info"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {videoInfo && (
          <div className="mt-4 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Video Information</h2>
            {videoInfo.thumbnail && (
              <Image
                src={videoInfo.thumbnail}
                alt="Thumbnail"
                width={256}
                height={144}
                className="mb-4"
                unoptimized={true}
              />
            )}
            <p>Duration: {fbFormatDuration(videoInfo.duration_ms)}</p>
            <div className="mt-4 flex space-x-4">
              {videoInfo.hd && (
                <button
                  onClick={() => downloadVideo("hd")}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all"
                  disabled={downloading}
                >
                  {downloading ? "Downloading..." : "Download Video"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl`}
      >
        <WorkingOfFacebookDownloader />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl mt-10">
        <IntroductionOfFacebookDownloader />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl mt-10">
        <FacebookDownloaderServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl mt-10`}
      >
        <HistoryOfFacebookDownloader />
      </div>
      <FAQFacebookDownloader />
    </div>
  );
}
