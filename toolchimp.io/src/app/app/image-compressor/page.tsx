"use client";
import FAQImageCompressor from "@/app/components/Faqs/FaqImageCompressor";
import HistoryOfImageCompressor from "@/app/components/Histories/HistoryOfImageCompresssor";
import ImageCompressorComponent from "@/app/components/ImageCompressor";
import IntroductionOfImageCompressor from "@/app/components/Introductions/IntroductionOfImageCompressor";
import ImageCompressorServiceCard from "@/app/components/ServicesCard/ImageCompressorServiceCard";
import WorkingOfImageCompressor from "@/app/components/Working/WorkingOfImageCompressor";
import useIsMobile from "@/app/hooks/MobileOnly";
export default function ImageCompressorPage() {
  const isMobile = useIsMobile();
  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
      style={{ backgroundColor: "#212121" }}
    >
      <div>
        <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
          <span className="page-title">Image Compressor</span>
        </h1>
        <ImageCompressorComponent />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <WorkingOfImageCompressor />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl">
        <IntroductionOfImageCompressor />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl">
        <ImageCompressorServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl `}
      >
        <HistoryOfImageCompressor />
      </div>
      <FAQImageCompressor />
    </div>
  );
}
