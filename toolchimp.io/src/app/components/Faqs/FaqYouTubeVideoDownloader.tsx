import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQYouTubeDownloader() {
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(
    null,
  );

  const toggleQuestion = (index: number) => {
    if (openQuestionIndex === index) {
      setOpenQuestionIndex(null);
    } else {
      setOpenQuestionIndex(index);
    }
  };

  const faqData = [
    {
      question: "Is ToolChimp's YouTube Video Downloader free to use?",
      answer:
        "Absolutely! ToolChimp provides a free online service that allows you to download and convert YouTube videos without any cost.",
    },
    {
      question: "Is it legal to download YouTube videos using ToolChimp?",
      answer:
        "Downloading copyrighted material without permission typically violates YouTube's terms of service and may be illegal in some jurisdictions. Always respect copyright laws and use the tool responsibly.",
    },
    {
      question: "Can I download YouTube short videos with ToolChimp?",
      answer: "Yes, ToolChimp supports downloading short videos in MP4 format.",
    },
    {
      question: "Does ToolChimp support high-quality video downloads?",
      answer: "Yes, ToolChimp allows you to download videos in MP4 format.",
    },
    {
      question: "Can I access ToolChimp on my smartphone?",
      answer:
        "Yes, ToolChimp is a web-based tool accessible from any device with an internet connection, including smartphones.",
    },
    {
      question: "Is ToolChimp safe to use?",
      answer:
        "ToolChimp is a safe and secure service, free from viruses, and operates under strict security protocols. However, always exercise caution when using any online tool and ensure your device has up-to-date security software.",
    },
  ];

  return (
    <div className="bg-[#212121] text-white w-full mt-10">
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              index={index}
              question={faq.question}
              answer={faq.answer}
              openQuestionIndex={openQuestionIndex}
              toggleQuestion={toggleQuestion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
