import ImageToTextConverterIcon from "@/icons/image-to-text-icon";
import React from "react";
import { BsImageFill } from "react-icons/bs";

export default function IntroductionOfImageToTextConverter() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div className="ml-5">
        <ImageToTextConverterIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Convert Image to Text
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>Upload an image file containing text you want to convert.</li>
            <li>
              The image will be displayed along with its file name for
              confirmation.
            </li>
            <li>
              Click or drag & drop to replace the image with another if needed.
            </li>
            <li>
              The image will be processed to extract text information from it.
            </li>
            <li>
              The extracted text will be displayed in a card format below the
              image.
            </li>
            <li>
              Use the copy button next to the text to copy it to your clipboard.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
