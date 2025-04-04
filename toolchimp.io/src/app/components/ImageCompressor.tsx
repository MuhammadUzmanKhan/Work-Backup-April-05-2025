import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import toast from "react-hot-toast";

type Dimensions = {
  width: number;
  height: number;
};

export default function ImageCompressorComponent() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [originalFileType, setOriginalFileType] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Dimensions | null>(
    null,
  );
  const [originalImageSize, setOriginalImageSize] = useState<number | null>(
    null,
  );
  const [compressedImageSize, setCompressedImageSize] = useState<number | null>(
    null,
  );
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const supportedFileTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
    "image/x-icon",
  ];

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!supportedFileTypes.includes(file.type)) {
        toast.error("Unsupported file type. Please upload an image.");
        return;
      }
      try {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          setOriginalImage(img.src);
          setOriginalImageSize(file.size);
          setImageDimensions({ width: img.width, height: img.height });
          setOriginalFileName(file.name);
          setOriginalFileType(file.type);
          setCompressedImage(null);
          toast.success("Image loaded successfully");
        };
      } catch (error) {
        console.error("Error during image loading:", error);
        toast.error("Error during image loading");
      }
    }
  };

  const handleCompress = async () => {
    if (originalImage && originalFileName && originalFileType) {
      const options = {
        maxSizeMB: 0.05,
        useWebWorker: true,
        initialQuality: 1,
      };

      try {
        setIsCompressing(true);
        const response = await fetch(originalImage);
        const blob = await response.blob();
        const file = new File([blob], originalFileName, {
          type: originalFileType,
        });
        const compressedFile = await imageCompression(file, options);
        setCompressedImage(compressedFile);
        setCompressedImageSize(compressedFile.size);
        setIsCompressing(false);
        toast.success("Image compressed successfully");
        console.log(`Compressed image size: ${compressedFile.size} bytes`);
      } catch (error) {
        console.error("Error during image compression:", error);
        toast.error("Error during image compression");
        setIsCompressing(false);
      }
    }
  };

  const handleDownload = () => {
    if (compressedImage && originalFileType && originalFileName) {
      setIsDownloading(true);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(compressedImage);
      const fileExtension = originalFileType.split("/")[1];
      const baseFileName = originalFileName.replace(/\.[^/.]+$/, "");
      link.download = `${baseFileName}_compressed.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Image downloaded successfully");

      setTimeout(() => {
        setIsDownloading(false);
      }, 3000); // Re-enable the button after 3 seconds
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-5 gap-3">
      <input
        type="file"
        accept="image/jpeg, image/png, image/gif, image/bmp, image/tiff, image/webp, image/x-icon"
        onChange={handleImageChange}
        className="p-2 bg-gray-800 text-white rounded-md w-full"
      />
      {originalImage && (
        <div className="mt-5">
          <Image
            src={originalImage}
            alt="Original"
            width={300}
            height={300}
            className="max-w-full h-auto"
          />
          <p className="mt-3 text-white">
            Original Image Size:{" "}
            {originalImageSize
              ? `${(originalImageSize / 1024).toFixed(2)} KB`
              : "-"}
          </p>
          {imageDimensions && (
            <p className="mt-3 text-white">
              Dimensions: {imageDimensions.width}x{imageDimensions.height}
            </p>
          )}
          {!compressedImage && (
            <button
              onClick={handleCompress}
              className="mt-3 p-2 bg-green-600 text-white rounded-md"
            >
              {isCompressing ? "Compressing..." : "Compress Image"}
            </button>
          )}
          {compressedImage && (
            <>
              <Image
                src={URL.createObjectURL(compressedImage)}
                alt="Compressed"
                width={300}
                height={300}
                className="max-w-full h-auto"
              />
              <p className="mt-3 text-white">
                Compressed Image Size:{" "}
                {compressedImageSize
                  ? `${(compressedImageSize / 1024).toFixed(2)} KB`
                  : "-"}
              </p>
              <button
                onClick={handleDownload}
                className="mt-3 p-2 bg-blue-600 text-white rounded-md"
                disabled={isDownloading}
              >
                {isDownloading ? "Downloading..." : "Download Compressed Image"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
