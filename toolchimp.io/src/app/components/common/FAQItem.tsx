import { FiChevronUp, FiChevronDown } from "react-icons/fi";

interface FAQItemProps {
  index: number;
  question: string;
  answer: string;
  openQuestionIndex: number | null;
  toggleQuestion: (index: number) => void;
}

function FAQItem({
  index,
  question,
  answer,
  openQuestionIndex,
  toggleQuestion,
}: FAQItemProps) {
  return (
    <div className="faq-item">
      <div
        className="flex justify-between items-center"
        onClick={() => toggleQuestion(index)}
      >
        <div className="faq-question text-xl font-semibold mb-2 cursor-pointer">
          {question}
        </div>
        {openQuestionIndex === index ? (
          <FiChevronUp className="text-gray-400 text-xl cursor-pointer" />
        ) : (
          <FiChevronDown className="text-gray-400 text-xl cursor-pointer" />
        )}
      </div>
      {openQuestionIndex === index && (
        <div className="faq-answer bg-gray-700 p-4 rounded">{answer}</div>
      )}
    </div>
  );
}

export default FAQItem;
