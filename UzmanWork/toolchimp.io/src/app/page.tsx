"use client";
import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-start p-5 bg-black text-white "
      style={{ backgroundColor: "#212121" }}
    >
      <h1
        className="text-4xl md:text-6xl text-center font-bold mb-12"
        style={{ marginTop: "0" }}
      >
        Powered By &nbsp;
        <span className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 text-transparent bg-clip-text">
          Phaedra Solutions
        </span>
      </h1>
      <div className="flex flex-wrap justify-center gap-5">
        <Link
          href="/app/flip-a-coin"
          className="block p-5 bg-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">Flip a Coin</h2>
          <p className="mt-2 text-gray-300">Try your luck with a coin flip</p>
        </Link>
        <Link
          href="/app/image-to-text-converter"
          className="block p-5 bg-green-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">Image to Text Converter</h2>
          <p className="mt-2 text-gray-300">Convert images to text easily</p>
        </Link>
        <Link
          href="/app/spin-the-wheel"
          className="block p-5 bg-yellow-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">Spin The Wheel</h2>
          <p className="mt-2 text-gray-300">Spin the wheel of fortune</p>
        </Link>
        <Link
          href="/app/youtube-video-downloader"
          className="block p-5 bg-red-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">YouTube Video Downloader</h2>
          <p className="mt-2 text-gray-300">Download YouTube videos easily</p>
        </Link>
        <Link
          href="/app/facebook-video-downloader"
          className="block p-5 bg-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">Facebook Video Downloader</h2>
          <p className="mt-2 text-gray-300">Download Facebook videos easily</p>
        </Link>
        <Link
          href="/app/age-calculator"
          className="block p-5 bg-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">Age Calculator</h2>
          <p className="mt-2 text-gray-300">Calculate your age</p>
        </Link>
        <Link
          href="/app/text-compare"
          className="block p-5 bg-yellow-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">Text Compare</h2>
          <p className="mt-2 text-gray-300">Compare your text</p>
        </Link>
        <Link
          href="/app/bmi-calculator"
          className="block p-5 bg-green-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">BMI Calculator</h2>
          <p className="mt-2 text-gray-300">
            Calculate your Body Mass Index easily
          </p>
        </Link>
        <Link
          href="/app/qr-code-generator"
          className="block p-5 bg-teal-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">QR Code Generator</h2>
          <p className="mt-2 text-gray-300">Generate Your QR Code</p>
        </Link>
        <Link
          href="/app/qr-code-scanner"
          className="block p-5 bg-pink-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-center"
        >
          <h2 className="text-2xl font-semibold">QR Code Scanner</h2>
          <p className="mt-2 text-gray-300">Scan Your QR Code</p>
        </Link>
      </div>
    </main>
  );
}
