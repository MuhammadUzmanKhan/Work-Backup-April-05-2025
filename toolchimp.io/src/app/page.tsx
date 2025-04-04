"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import useIsMobile from "./hooks/MobileOnly";
import { CDN_URL } from "./constants";

export default function Home() {
  const isMobile = useIsMobile();

  const linkClasses = isMobile
    ? "block p-5 bg-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center w-full"
    : "block p-5 bg-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center";

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-start p-5 bg-black text-white"
      style={{ backgroundColor: "#212121" }}
    >
      <h1
        className="text-4xl md:text-6xl text-center font-bold mb-12"
        style={{ marginTop: "0" }}
      >
        ONLINE TOOLS
      </h1>
      <div
        className={`flex flex-wrap justify-center gap-5 ${isMobile ? "flex-col items-stretch" : ""}`}
      >
        <Link href="/app/flip-a-coin" className={linkClasses}>
          <h2 className="text-2xl font-semibold">Flip a Coin</h2>
          <p className="mt-2 text-gray-300">Try your luck with a coin flip</p>
        </Link>
        <Link
          href="/app/image-to-text-converter"
          className={linkClasses.replace("bg-blue-500", "bg-green-500")}
        >
          <h2 className="text-2xl font-semibold">Image to Text Converter</h2>
          <p className="mt-2 text-gray-300">Convert images to text easily</p>
        </Link>
        <Link
          href="/app/spin-the-wheel"
          className={linkClasses.replace("bg-blue-500", "bg-yellow-500")}
        >
          <h2 className="text-2xl font-semibold">Spin The Wheel</h2>
          <p className="mt-2 text-gray-300">Spin the wheel of fortune</p>
        </Link>
        <Link
          href="/app/youtube-video-downloader"
          className={linkClasses.replace("bg-blue-500", "bg-red-500")}
        >
          <h2 className="text-2xl font-semibold">YouTube Video Downloader</h2>
          <p className="mt-2 text-gray-300">Download YouTube videos easily</p>
        </Link>
        <Link
          href="/app/facebook-video-downloader"
          className={linkClasses.replace("bg-blue-500", "bg-purple-500")}
        >
          <h2 className="text-2xl font-semibold">Facebook Video Downloader</h2>
          <p className="mt-2 text-gray-300">Download Facebook videos easily</p>
        </Link>
        <Link href="/app/age-calculator" className={linkClasses}>
          <h2 className="text-2xl font-semibold">Age Calculator</h2>
          <p className="mt-2 text-gray-300">Calculate your age</p>
        </Link>
        <Link
          href="/app/text-compare"
          className={linkClasses.replace("bg-blue-500", "bg-yellow-500")}
        >
          <h2 className="text-2xl font-semibold">Text Compare</h2>
          <p className="mt-2 text-gray-300">Compare your text</p>
        </Link>
        <Link
          href="/app/bmi-calculator"
          className={linkClasses.replace("bg-blue-500", "bg-green-500")}
        >
          <h2 className="text-2xl font-semibold">BMI Calculator</h2>
          <p className="mt-2 text-gray-300">
            Calculate your Body Mass Index easily
          </p>
        </Link>
        <Link
          href="/app/qr-code-generator"
          className={linkClasses.replace("bg-blue-500", "bg-teal-500")}
        >
          <h2 className="text-2xl font-semibold">QR Code Generator</h2>
          <p className="mt-2 text-gray-300">Generate Your QR Code</p>
        </Link>
        <Link
          href="/app/image-compressor"
          className={linkClasses.replace("bg-blue-500", "bg-pink-500")}
        >
          <h2 className="text-2xl font-semibold">Image Compressor</h2>
          <p className="mt-2 text-gray-300">Compress Your Image</p>
        </Link>
      </div>

      {/* Blog Section */}
      <section className="w-full mt-12">
        <h2 className="text-3xl font-bold text-center mb-8">Blog</h2>
        <div className="flex flex-col items-center">
          <div className="bg-gray-800 p-6 rounded-lg mb-6 w-full max-w-3xl">
            <Link href="/blog/how-to-fix-windows-11-crowdstrike-error">
              <div className="flex flex-col md:flex-row items-center">
                <div className="relative w-full md:w-1/3 h-48 md:h-32 mb-4 md:mb-0 md:mr-4">
                  <Image
                    src={`${CDN_URL}/img/CrowdStrike-BSOD-Error-Microsoft-1024x576.jpeg`}
                    alt="How to Fix Windows 11 CrowdStrike Error"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    How to Fix Windows 11 CrowdStrike Error
                  </h3>
                  <p className="mt-2 text-gray-300">
                    Follow these steps to fix the Windows 11 CrowdStrike error
                    causing BSOD (Blue Screen of Death).
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
