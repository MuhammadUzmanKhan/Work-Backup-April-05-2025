import React from "react";
import { ServicesFeatureCard } from "../common/ServicesFeatureCard"; // Assuming you have a ServicesFeatureCard component

export default function ImageToTextConverterServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-centers">
        <ServicesFeatureCard
          icon="📷"
          title="Upload Image"
          description="Upload an image file containing text you want to convert."
        />
        <ServicesFeatureCard
          icon="🔄"
          title="Easy Conversion"
          description="Our converter swiftly processes the image to extract text information."
        />
        <ServicesFeatureCard
          icon="📄"
          title="Text Output"
          description="View the extracted text displayed in a readable format."
        />
        <ServicesFeatureCard
          icon="📋"
          title="Copy Text"
          description="Copy the extracted text to your clipboard with a single click."
        />
        <ServicesFeatureCard
          icon="💻"
          title="Accessible Anywhere"
          description="Use the Image to Text Converter from any device with internet access."
        />
        <ServicesFeatureCard
          icon="🔍"
          title="High Accuracy"
          description="Accurately detects and converts text from uploaded images."
        />
      </div>
    </div>
  );
}
