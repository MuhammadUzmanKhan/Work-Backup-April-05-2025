"use client";
import React, { useState, KeyboardEvent } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import Image from "next/image";
import { fbFormatDuration } from "@/app/utils/globals";

export default function FacebookVideoDownloader() {
  const [url, setUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  const isValidUrl = (url: string) => {
    return url.includes("https://www.facebook.com/watch?v=");
  };
  const getVideoInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/getFbVideoInfo?url=${encodeURIComponent(url)}`
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
      <h1 className="text-2xl font-bold mb-4">Facebook Video Downloader</h1>
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
  );
}
