import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQImageToTextConverter() {
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
      question: "Is ToolChimp's Image to Text Converter free to use?",
      answer:
        "Yes, ToolChimp offers a free online service for converting images containing text into editable text format.",
    },
    {
      question: "How accurate is ToolChimp's Image to Text conversion?",
      answer:
        "ToolChimp's Image to Text Converter utilizes advanced OCR technology to provide accurate text extraction from images. However, accuracy may vary based on image quality and complexity.",
    },
    {
      question: "Can I use ToolChimp's Image to Text converter for free ?",
      answer: "Yes, ToolChimp provides the Image to Text converter for free ",
    },
    {
      question:
        "Is there a limit to the size or number of images I can convert?",
      answer:
        "ToolChimp does not impose a strict limit on the size or number of images you can convert. However, larger or numerous files may affect processing speed.",
    },
    {
      question: "Can I download the extracted text from ToolChimp?",
      answer:
        "Yes, after converting an image to text, you can copy the extracted text to your clipboard or download it for further use.",
    },
    {
      question: "Is ToolChimp's Image to Text Converter secure?",
      answer:
        "ToolChimp prioritizes user security and operates under strict privacy policies. Your uploaded images and extracted text are processed securely.",
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
