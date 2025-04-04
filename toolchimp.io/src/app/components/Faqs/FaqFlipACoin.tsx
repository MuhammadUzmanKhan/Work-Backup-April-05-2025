import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQFlipCoin() {
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
      question: "How many times can I use the virtual coin flipper?",
      answer:
        "ToolChimp offers an unlimited number of times for you to use our heads or tails simulator.",
    },
    {
      question: "Is ToolChimp's virtual coin flipper free to use?",
      answer: "Yes, ToolChimp's virtual coin flipper is completely free.",
    },
    {
      question:
        "Do I need to create an account to use ToolChimp's virtual coin flipper?",
      answer:
        "No, you do not need to create an account. ToolChimp allows you to flip the virtual coin without any registration.",
    },
    {
      question: "How many sides does ToolChimp's virtual coin have?",
      answer: "The virtual coin from ToolChimp has two sides: heads and tails.",
    },
    {
      question: "Which is more likely to appear, heads or tails?",
      answer:
        "In a fair coin flip, heads and tails have an equal probability of appearing, which is 50% each.",
    },
    {
      question:
        "How does ToolChimp's coin flip differ from Google's coin flip?",
      answer:
        "ToolChimp's coin flip simulator offers simplicity and ease of use, allowing you to quickly make a random decision without any distractions.",
    },
    {
      question:
        "What are the practical uses of ToolChimp's heads or tails coin flip simulator?",
      answer:
        "You can use ToolChimp's virtual coin flipper to make decisions in various scenarios, such as household chores, determining game starting order, and making personal choices.",
    },
  ];

  return (
    <div className="bg-[#212121] text-white w-full">
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
