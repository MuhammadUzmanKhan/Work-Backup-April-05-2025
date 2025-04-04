import React, { useState } from "react";
import FAQItem from "../common/FAQItem";

export default function FAQBMICalculator() {
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
      question: "What is BMI?",
      answer:
        "Body Mass Index (BMI) is a measure that uses your height and weight to estimate if you are underweight, normal weight, overweight, or obese.",
    },
    {
      question: "How is BMI calculated?",
      answer:
        "BMI is calculated by dividing your weight in kilograms by the square of your height in meters. Alternatively, you can use our BMI calculator to easily compute your BMI.",
    },
    {
      question: "Is the BMI calculation accurate?",
      answer:
        "BMI is a useful indicator of healthy weight for most people, but it may not be accurate for everyone, such as athletes with high muscle mass. Always consider other factors like diet, activity level, and family history.",
    },
    {
      question: "Can children use the BMI calculator?",
      answer:
        "BMI calculators for children use different criteria than those for adults. It’s best to consult with a healthcare provider for an accurate assessment for children.",
    },
    {
      question: "What do the BMI categories mean?",
      answer:
        "The categories are: Underweight (BMI < 18.5), Normal weight (BMI 18.5 - 24.9), Overweight (BMI 25 - 29.9), and Obese (BMI 30 or higher). Each category can indicate different health risks.",
    },
    {
      question: "How often should I check my BMI?",
      answer:
        "It’s a good idea to check your BMI periodically, especially if your weight or activity level has changed. Monitoring your BMI can help you stay on track with your health goals.",
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
