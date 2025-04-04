"use client";
import { CDN_URL } from "@/app/constants";
import useIsMobile from "@/app/hooks/MobileOnly";
import Head from "next/head";
import Image from "next/image";
import React from "react";

export default function CrowdStrike() {
  const isMobile = useIsMobile();
  const publishTime = new Date("2024-07-20T00:00:00Z").toLocaleDateString();

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3 mb-5"
      style={{ backgroundColor: "#212121", color: "#FFFFFF" }}
    >
      <h1 className="text-4xl md:text-6xl font-bold mb-5 text-center">
        How to Fix Windows 11 CrowdStrike Error
      </h1>

      <p className="text-lg mb-6 text-center">Published on: {publishTime}</p>

      <div className="mx-auto" style={{ width: isMobile ? "90%" : "80%" }}>
        <Image
          src={`${CDN_URL}/img/CrowdStrike-BSOD-Error-Microsoft-1024x576.jpeg`}
          alt="CrowdStrike Error Banner"
          layout="responsive"
          style={{
            maxWidth: isMobile ? "95%" : "80%",
            maxHeight: "500",
            margin: "0 auto",
            marginBottom: 50,
          }}
          width={1024}
          height={576}
        />

        <p className="text-lg">
          Follow these steps to fix the Windows 11 CrowdStrike error causing
          BSOD (Blue Screen of Death). These instructions will help you resolve
          the issue and get your system running smoothly.
        </p>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">Step 1: Reboot the Host</h2>
          <p className="mt-2">
            Reboot the host to give it an opportunity to download the reverted
            channel file. We strongly recommend putting the host on a wired
            network (as opposed to WiFi) prior to rebooting as the host will
            acquire internet connectivity considerably faster via ethernet.
          </p>
        </div>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">
            Step 2: Boot into Safe Mode or Windows Recovery Environment
          </h2>
          <ul className="mt-2 list-disc pl-5">
            <li>
              If the host crashes again, boot Windows into Safe Mode or the
              Windows Recovery Environment (WinRE).
            </li>
            <li>
              <strong>Note:</strong> Putting the host on a wired network (as
              opposed to WiFi) and using Safe Mode with Networking can help
              remediation.
            </li>
          </ul>
          <pre className="bg-gray-700 p-2 rounded mt-2 scrollable-code">
            <code>
              To boot into Safe Mode:
              <ol className="list-decimal pl-5 ml-5">
                <li>Restart your computer.</li>
                <li>
                  Press <strong>F8</strong> (or <strong>Shift</strong> +{" "}
                  <strong>F8</strong>) before Windows starts loading.
                </li>
                <li>
                  Select <strong>Safe Mode</strong> or{" "}
                  <strong>Safe Mode with Networking</strong>.
                </li>
              </ol>
            </code>
          </pre>
        </div>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">
            Step 3: Open Command Line in Safe Mode
          </h2>
          <pre className="bg-gray-700 p-2 rounded mt-2 scrollable-code">
            <code>
              <ol className="list-decimal pl-5 ml-5 mt-2">
                <li>
                  Once in Safe Mode, press <strong>Win + R</strong> to open the
                  Run dialog.
                </li>
                <li>
                  Type <strong>cmd</strong> and press <strong>Enter</strong>.
                </li>
              </ol>
            </code>
          </pre>
        </div>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">
            Step 3: Navigate to CrowdStrike Directory
          </h2>
          <p className="mt-2">
            Navigate to the{" "}
            <strong style={{ wordWrap: "break-word" }}>
              %WINDIR%\System32\drivers\CrowdStrike
            </strong>{" "}
            directory.
          </p>
          <p className="mt-2">
            <strong>Note:</strong> On WinRE/WinPE, navigate to the{" "}
            <strong style={{ wordWrap: "break-word" }}>
              Windows\System32\drivers\CrowdStrike
            </strong>{" "}
            directory of the OS volume.
          </p>
          <pre className="bg-gray-700 p-2 rounded mt-2 scrollable-code">
            <code>cd %WINDIR%\System32\drivers\CrowdStrike</code>
          </pre>
          or
          <pre className="bg-gray-700 p-2 rounded mt-2 scrollable-code">
            <code>cd x:\Windows\System32\drivers\CrowdStrike</code>
          </pre>
        </div>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">
            Step 5: Delete the Specific File
          </h2>
          <p className="mt-2">
            Locate the file matching <strong>“C-00000291*.sys”</strong>, and
            delete it.
          </p>
          <pre className="bg-gray-700 p-2 rounded mt-2 scrollable-code">
            <code>del C-00000291*.sys</code>
          </pre>
        </div>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">
            Step 6: Boot the Host Normally
          </h2>
          <p className="mt-2">Boot the host normally.</p>
          <p className="mt-2">
            <strong>Note:</strong> BitLocker-encrypted hosts may require a
            recovery key.
          </p>
        </div>

        <div className="bg-gray-800 my-4 p-4 rounded-lg">
          <h2 className="text-2xl font-semibold">Need Help?</h2>
          <p className="mt-2">
            If none of the above steps resolve the issue, contact CrowdStrike
            support or your IT department for further assistance.
          </p>
        </div>

        <p className="text-lg mt-6">
          We hope this guide helps you fix the Windows 11 CrowdStrike error. If
          you have any questions, please contact us.
        </p>
      </div>
    </div>
  );
}
