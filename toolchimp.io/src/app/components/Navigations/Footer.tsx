"use client";
import React from "react";
import { APP_NAME, SOCIAL } from "@/app/constants";
import Link from "next/link";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { BsDiscord } from "react-icons/bs";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap">
          <div className="w-full sm:w-1/2 md:w-1/4 mb-6">
            <h3 className="font-bold text-lg mb-3 uppercase">
              What we offer ?
            </h3>
            <ul className="list-none space-y-2 text-sm">
              <li>
                <label className="hover:opacity-80">Free Online Tools</label>
              </li>
              <li>
                <label className="hover:opacity-80">No Payments</label>
              </li>
              <li>
                <label className="hover:opacity-80">5k Tools</label>
              </li>
            </ul>
          </div>
          <div className="w-full sm:w-1/2 md:w-1/4 mb-6">
            <h3 className="font-bold text-lg mb-3 uppercase">About</h3>
            <ul className="list-none space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:opacity-80">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:opacity-80">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full md:w-1/2 mb-6 text-sm">
            <h3 className="font-bold text-lg mb-3 uppercase">{APP_NAME}</h3>
            <p className="opacity-60">
              Welcome to Toolchimp.io, your one-stop destination for a diverse
              array of free online tools designed to make your life easier, more
              productive, and a bit more fun. Whether you need to make a quick
              decision, manage your tasks, or just pass some time, Toolchimp.io
              has got you covered.
            </p>
          </div>
          <div className="w-full text-center mt-6 flex justify-center space-x-4">
            <Link
              href={SOCIAL.FACEBOOK}
              target="_blank"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:opacity-90"
            >
              <FaFacebook size={24} />
            </Link>
            <Link
              href={SOCIAL.TWITTER}
              target="_blank"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:opacity-90"
            >
              <FaXTwitter size={24} />
            </Link>
            <Link
              href={SOCIAL.DISCORD}
              target="_blank"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:opacity-90"
            >
              <BsDiscord size={24} />
            </Link>
            <Link
              href={SOCIAL.GITHUB}
              target="_blank"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:opacity-90"
            >
              <FaGithub size={24} />
            </Link>
          </div>
        </div>
        <p className="text-center text-md opacity-30 mt-6 uppercase">
          {APP_NAME} © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
