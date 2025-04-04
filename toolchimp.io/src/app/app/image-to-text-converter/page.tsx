"use client";

import React, { useRef, useState } from "react";
import TextCard from "@/app/components/Cards/TextCard";
import { BsImageFill } from "react-icons/bs";
import convertor from "../../lib/convertor";
import Image from "next/image";
import useIsMobile from "@/app/hooks/MobileOnly";
import WorkingOfImageToTextConverter from "@/app/components/Working/WorkingOfImageToTextConverter";
import IntroductionOfImageToTextConverter from "@/app/components/Introductions/IntroductionOfImageToTextConverter";
import ImageToTextConverterServiceCard from "@/app/components/ServicesCard/ImageToTextConverterServiceCard";
import HistoryOfImageToTextConverter from "@/app/components/Histories/HistoryOfImageToTextConverter";
import FAQImageToTextConverter from "@/app/components/Faqs/FaqImageToTextConverter";

export default function ImageToText() {
  const [processing, setProcessing] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useIsMobile();

  const openBrowseImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const convert = async (url: string) => {
    if (url.length) {
      setProcessing(true);
      try {
        const txt = await convertor(url);
        setText(txt);
      } catch (error) {
        console.error("Error during image conversion:", error);
      } finally {
        setProcessing(false);
      }
    }
  };
  return (
    <div className="min-h-[90vh]">
      <div>
        <h1 className="text-white text-4xl md:text-6xl text-center px-5 pt-5 font-[800]">
          <span className="page-title">Image to Text Converter</span>
        </h1>
        <input
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setImagePreview(url);
              setFileName(file.name);
              setText("");
              convert(url);
            }
          }}
          ref={imageInputRef}
          type="file"
          hidden
          required
        />
        <div className="relative md:bottom-10 w-full flex flex-col gap-10 items-center justify-center p-5 md:p-20">
          <div
            onClick={openBrowseImage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setImagePreview(url);
                setFileName(file.name);
                setText("");
                convert(url);
              }
            }}
            className="relative w-full min-h-[30vh] md:min-h-[50vh] p-5 bg-[#202020] cursor-pointer rounded-xl flex items-center justify-center border border-gray-600"
          >
            {imagePreview ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px]">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    layout="fill"
                    objectFit="contain"
                    className="rounded-xl"
                  />
                </div>
                <p
                  className="text-lg md:text-xl text-center px-5 pt-5 font-[400]"
                  style={{ color: "#fff" }}
                >
                  {fileName}
                </p>
                <button
                  onClick={openBrowseImage}
                  className="bg-[#fff] px-5 py-2 rounded-md hover:bg-[#8d8d8d] transition-all md:text-base text-sm"
                >
                  Drag & Drop here to replace
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center flex-col gap-3">
                <p className="text-2xl md:text-3xl text-center text-[#707070] font-[800]">
                  {processing
                    ? "Processing Image..."
                    : "Browse Or Drop Your Image Here"}
                </p>
                <span className="text-8xl md:text-[150px] block text-[#5f5f5f]">
                  <BsImageFill className={processing ? "animate-pulse" : ""} />
                </span>
              </div>
            )}
          </div>
          {text && <TextCard t={text} />}
        </div>
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl`}
      >
        <WorkingOfImageToTextConverter />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl ">
        <IntroductionOfImageToTextConverter />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl mt-10">
        <ImageToTextConverterServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl mt-10`}
      >
        <HistoryOfImageToTextConverter />
      </div>
      <FAQImageToTextConverter />
    </div>
  );
}
