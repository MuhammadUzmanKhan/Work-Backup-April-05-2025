import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQImageCompressor() {
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
      question: "Is ToolChimp's Image Compressor free to use?",
      answer:
        "Absolutely! ToolChimp provides a free online service that allows you to compress images without any cost.",
    },
    {
      question: "What can I use ToolChimp's Image Compressor for?",
      answer:
        "You can use our Image Compressor to reduce the file size of your images, making it easier to upload, share, and store them.",
    },
    {
      question: "Can I compress images of any format?",
      answer:
        "ToolChimp's Image Compressor supports various formats including JPEG, PNG, GIF, BMP, TIFF, WEBP, and ICO.",
    },
    {
      question: "Is ToolChimp's Image Compressor easy to use?",
      answer:
        "Yes, ToolChimp's Image Compressor is designed to be user-friendly. Simply upload your image, click the 'Compress Image' button, and download the compressed image.",
    },
    {
      question: "Can I download the compressed image?",
      answer:
        "Yes, once you compress an image, you can download it as a file to use in your projects or share with others.",
    },
    {
      question: "Is ToolChimp's Image Compressor safe to use?",
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
