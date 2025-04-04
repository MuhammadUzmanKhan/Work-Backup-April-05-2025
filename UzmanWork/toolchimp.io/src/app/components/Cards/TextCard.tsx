import React from "react";
import toast from "react-hot-toast";

const TextCard = ({ t }: { t: string }) => {
  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied To Clipboard.");
  };

  return (
    <div className="w-full border border-gray-600 p-5  rounded-lg">
      <div className="flex items-center justify-end mb-5 px-5 gap-10">
        <button
          onClick={() => copyToClipboard(t)}
          className="bg-[#fff] px-5 py-2 rounded-md hover:bg-[#8d8d8d] transition-all md:text-base text-sm"
        >
          Copy
        </button>
      </div>
      <textarea
        className="w-full outline-none rounded-xl text-white min-h-[25vh] md:min-h-[50vh] bg-[#202020] p-5 tracking-wider font-[300] text-sm"
        value={t}
        readOnly
      ></textarea>
    </div>
  );
};

export default TextCard;
