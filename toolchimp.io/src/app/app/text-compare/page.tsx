"use client";

import FAQTextComparison from "@/app/components/Faqs/FaqTextComparison";
import HistoryOfTextComparison from "@/app/components/Histories/HistoryOfTextComparison";
import IntroductionOfTextComparison from "@/app/components/Introductions/IntroductionOfTextComparison";
import TextComparisonServiceCard from "@/app/components/ServicesCard/TextComparisonServiceCard";
import TextComparison from "@/app/components/TextComparison";
import WorkingOfTextComparison from "@/app/components/Working/WorkingOfTextCompare";
import useIsMobile from "@/app/hooks/MobileOnly";

export default function TextComparisonPage() {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-2 ">
      <main className="flex flex-col items-center w-full flex-1 px-4 text-center">
        <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
          <span className="page-title pb-5">Text Comparison</span>
        </h1>
        <TextComparison />
      </main>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <WorkingOfTextComparison />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl">
        <IntroductionOfTextComparison />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl">
        <TextComparisonServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <HistoryOfTextComparison />
      </div>
      <FAQTextComparison />
    </div>
  );
}
