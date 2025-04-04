"use client";
import React, { useState, KeyboardEvent } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import Image from "next/image";
import { ytFormatDuration } from "@/app/utils/globals";

export default function YouTubeVideoDownloader() {
  const [url, setUrl] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  const getVideoInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/getYtVideoInfo?url=${encodeURIComponent(url)}`
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
  const isValidUrl = (url: string) => {
    return url.includes("https://www.youtube.com/watch?v=");
  };

  const downloadVideo = async () => {
    if (videoInfo) {
      try {
        setDownloading(true);
        const response = await fetch(
          `/api/downloadYtVideo?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) {
          throw new Error("Failed to download video");
        }
        const blob = await response.blob();
        saveAs(blob, `${videoInfo.videoDetails.title}.mp4`);
        toast.success("Downloaded successfully");
      } catch (error: any) {
        setError("Error downloading video: " + error.message);
      } finally {
        setDownloading(false);
      }
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isValidUrl(url)) {
        getVideoInfo();
      } else {
        setError("Enter Valid YouTube URL Here");
      }
    }
  };

  return (
    <div
      className="p-5 bg-black min-h-screen text-white flex flex-col justify-start items-center"
      style={{ backgroundColor: "#212121" }}
    >
      <h1 className="text-2xl font-bold mb-4">YouTube Video Downloader</h1>
      <label className="block mb-2">
        Enter YouTube Video URL to download in mp4:
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyPress}
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
          {videoInfo.videoDetails.thumbnails?.length > 0 && (
            <Image
              src={videoInfo.videoDetails.thumbnails[0].url}
              alt="Thumbnail"
              width={256}
              height={144}
              className="w-64 h-auto mb-4"
            />
          )}
          <p>Title: {videoInfo.videoDetails.title}</p>
          <p>Author: {videoInfo.videoDetails.author.name}</p>
          <p>
            Duration: {ytFormatDuration(videoInfo.videoDetails.lengthSeconds)}
          </p>
          <button
            onClick={downloadVideo}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition-all"
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download Video"}
          </button>
        </div>
      )}
    </div>
  );
}
