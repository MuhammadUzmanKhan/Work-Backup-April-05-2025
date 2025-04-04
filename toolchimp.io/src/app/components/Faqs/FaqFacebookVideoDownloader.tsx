import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQFacebookDownloader() {
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
      question: "Is ToolChimp's Facebook Video Downloader free to use?",
      answer:
        "Yes, ToolChimp provides a free online service that allows you to download Facebook videos without any cost.",
    },
    {
      question: "Is it legal to download Facebook videos using ToolChimp?",
      answer:
        "Downloading copyrighted material without permission may violate Facebook's terms of service and could be illegal in some jurisdictions. Always respect copyright laws and use the tool responsibly.",
    },
    {
      question: "Can I download Facebook videos in HD with ToolChimp?",
      answer:
        "Yes, ToolChimp supports downloading Facebook videos in HD quality.",
    },
    {
      question: "Does ToolChimp allow batch downloading of Facebook videos?",
      answer:
        "ToolChimp allows you to download multiple Facebook videos simultaneously.",
    },
    {
      question:
        "Can I use ToolChimp's Facebook Video Downloader on mobile devices?",
      answer:
        "Yes, ToolChimp's Facebook Video Downloader is web-based and accessible from any device with an internet connection, including smartphones.",
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
