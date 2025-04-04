import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQTextComparison() {
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
      question: "Is the Text Comparison Tool free to use?",
      answer:
        "Yes, our Text Comparison Tool is completely free to use, allowing you to compare texts without any cost.",
    },
    {
      question: "How do I use the Text Comparison Tool?",
      answer:
        "To use the tool, simply paste the two pieces of text you want to compare into the input fields and click the 'Compare' button. The tool will highlight the differences between the texts.",
    },
    {
      question: "Can I compare large texts with this tool?",
      answer:
        "Yes, our Text Comparison Tool can handle large texts, making it suitable for a variety of use cases.",
    },
    {
      question: "Is my data safe with the Text Comparison Tool?",
      answer:
        "Absolutely! We prioritize your privacy and ensure that your data is processed securely and not stored on our servers.",
    },
    {
      question: "Can I use the Text Comparison Tool on my mobile device?",
      answer:
        "Yes, our Text Comparison Tool is web-based and can be accessed from any device with an internet connection, including smartphones.",
    },
    {
      question: "Does the tool support different languages?",
      answer:
        "Yes, our Text Comparison Tool supports multiple languages, allowing you to compare texts in various languages seamlessly.",
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
