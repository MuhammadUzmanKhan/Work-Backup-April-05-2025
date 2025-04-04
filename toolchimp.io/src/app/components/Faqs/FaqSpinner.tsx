import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQSpinner() {
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
      question: "What is the Spinner tool?",
      answer:
        "The Spinner tool is an interactive way to randomly select a winner or make a decision by spinning a wheel with user-defined entries.",
    },
    {
      question: "How do I use the Spinner?",
      answer:
        "To use the Spinner, simply enter the names or items into the input field, up to 10 entries. Then click the 'Start' button to spin the wheel. The pointer will indicate the winner when the wheel stops.",
    },
    {
      question: "Is the Spinner tool free to use?",
      answer:
        "Yes, the Spinner tool is completely free to use with no hidden charges or subscriptions.",
    },
    {
      question: "Can I use the Spinner tool on my mobile device?",
      answer:
        "Yes, the Spinner tool is fully web-based and can be accessed from any device with an internet connection, including smartphones and tablets.",
    },
    {
      question: "Is there a limit to the number of entries I can input?",
      answer: "Yes, you can input up to 10 entries at a time.",
    },
    {
      question: "Is the Spinner tool safe to use?",
      answer:
        "Absolutely! The Spinner tool is safe and does not require any downloads or installations. Your data is not stored or shared.",
    },
    {
      question: "Can I customize the colors of the Spinner segments?",
      answer:
        "Currently, the colors of the Spinner segments are automatically assigned. Customization options may be added in future updates.",
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
