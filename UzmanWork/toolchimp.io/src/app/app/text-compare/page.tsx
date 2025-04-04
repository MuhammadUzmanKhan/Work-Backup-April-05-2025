"use client";

import TextComparison from "@/app/components/TextComparison";

export default function TextComparisonPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-2 ">
      <main className="flex flex-col items-center w-full flex-1 px-4 text-center">
        <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
          <span className="page-title pb-5">Text Comparison</span>
        </h1>
        <TextComparison />
      </main>
    </div>
  );
}
