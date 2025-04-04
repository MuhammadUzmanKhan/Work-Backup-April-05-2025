import React from "react";

const Footer = () => {
  return (
    <footer className="w-full flex items-center justify-center p-5 text-white">
      <p>
        Built by &nbsp;
        <a
          href="https://www.phaedrasolutions.com/company/about-us"
          target="_blank"
          referrerPolicy="no-referrer"
          className="underline text-[#ff8e3d]"
        >
          Phaedra Solutions
        </a>
      </p>
    </footer>
  );
};

export default Footer;
