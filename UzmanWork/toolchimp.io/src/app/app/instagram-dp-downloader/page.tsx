"use client";
import Image from "next/image";
import { useState } from "react";

export default function InstagramDpDownloader() {
  const [username, setUsername] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [imgSrc, setImgSrc] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  const handleDownload = async () => {
    if (!username.trim()) {
      setDownloadStatus("Please enter an Instagram username.");
      return;
    }

    setLoadingProfile(true);
    try {
      const profileLink = `https://www.instagram.com/${username}/`;
      const response = await fetch(
        `/api/getInstaProfileData?profileLink=${encodeURIComponent(
          profileLink
        )}`
      );
      const data = await response.json();
      if (response.ok) {
        console.log("image", data.imgSrc);
        setImgSrc(data.imgSrc);
        setDownloadStatus("Profile picture loaded successfully.");
      } else {
        setDownloadStatus(`Failed to load profile picture: ${data.error}`);
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
      setDownloadStatus("Failed to load profile picture. Please try again.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const downloadImage = async () => {
    if (!imgSrc) {
      setDownloadStatus("No image to download.");
      return;
    }

    setDownloadingImage(true);
    try {
      const proxyUrl = `/api/getInstaImageDownload?imageUrl=${encodeURIComponent(
        imgSrc
      )}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${username}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the image:", error);
      setDownloadStatus("Failed to download the image. Please try again.");
    } finally {
      setDownloadingImage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDownloadStatus("");
    setUsername(e.target.value);
  };

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen bg-gray-100 pt-5 gap-5 "
      style={{ backgroundColor: "#212121" }}
    >
      <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
        <span className="page-title">Instagram DP Downloader</span>
      </h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <input
          type="text"
          value={username}
          onChange={handleInputChange}
          placeholder="Enter Instagram username"
          className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleDownload}
          className={`w-full bg-blue-500 text-white p-2 rounded-lg focus:outline-none ${
            loadingProfile ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loadingProfile}
        >
          {loadingProfile
            ? "Loading Profile Picture..."
            : "Load Profile Picture"}
        </button>
      </div>
      {imgSrc && !loadingProfile && username && (
        <div className="mt-4 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src={imgSrc}
              alt="Profile Picture"
              width={128}
              height={128}
              className="rounded-lg shadow-lg"
            />
          </div>
          <button
            onClick={downloadImage}
            className={`bg-green-500 text-white p-2 rounded-lg focus:outline-none ${
              downloadingImage ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloadingImage}
          >
            {downloadingImage
              ? "Downloading Profile Picture..."
              : "Download Profile Picture"}
          </button>
        </div>
      )}
      {downloadStatus && (
        <p className="mt-4 text-center text-red-500">{downloadStatus}</p>
      )}
    </div>
  );
}
