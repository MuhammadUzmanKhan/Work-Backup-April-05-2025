"use client";
import React from "react";
import { FiArrowUpRight, FiArrowLeft } from "react-icons/fi";
import { usePathname } from "next/navigation";
import Link from "next/link";

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 left-0 backdrop-blur-xl px-5 md:px-20 py-5 text-white flex items-center justify-between z-50 border-b-2 border-solid border-gray-700">
      <div className="flex gap-5">
        {pathname !== "/" && (
          <Link
            href="/"
            className="bg-gray-700 p-2 rounded-md hover:bg-gray-500 transition-all text-base flex items-center"
          >
            <FiArrowLeft size={20} />
          </Link>
        )}
        <a
          href="https://www.phaedrasolutions.com/"
          target="_blank"
          referrerPolicy="no-referrer"
          className="bg-white px-5 py-2 text-black rounded-md font-[800] text-sm md:text-base flex items-center md:gap-1"
        >
          <span>Visit Phaedra</span>
          <span className="text-md md:text-xl">
            <FiArrowUpRight />
          </span>
        </a>
      </div>
    </header>
  );
};

export default Header;
