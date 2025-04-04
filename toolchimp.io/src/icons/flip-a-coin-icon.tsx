import React from "react";
import { FiDatabase } from "react-icons/fi";
const FlipACoinIcon = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex items-center justify-center h-32 w-32 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center h-20 w-20 bg-black rounded-md shadow-md">
          <FiDatabase className="text-4xl text-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default FlipACoinIcon;
