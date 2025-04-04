import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQAgeCalculator() {
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
      question: "Is ToolChimp's Age Calculator free to use?",
      answer:
        "Absolutely! ToolChimp provides a free online service that allows you to calculate your age without any cost.",
    },
    {
      question: "How accurate is ToolChimp's Age Calculator?",
      answer:
        "ToolChimp's Age Calculator is highly accurate and accounts for leap years, ensuring precise age calculations down to the day.",
    },
    {
      question: "Can I calculate age in months and days?",
      answer:
        "Yes, ToolChimp's Age Calculator allows you to calculate your age in years, months, days, hours, minutes, and even seconds.",
    },
    {
      question:
        "Do I need to create an account to use ToolChimp's Age Calculator?",
      answer:
        "No, ToolChimp's Age Calculator is free to use and does not require any registration or account creation.",
    },
    {
      question: "Can I use ToolChimp's Age Calculator on my smartphone?",
      answer:
        "Yes, ToolChimp is a web-based tool accessible from any device with an internet connection, including smartphones.",
    },
    {
      question: "Is ToolChimp's Age Calculator safe to use?",
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
