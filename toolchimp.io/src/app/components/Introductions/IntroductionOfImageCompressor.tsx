import ImageIcon from "@/icons/image-icon";

export default function IntroductionOfImageCompressor() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div ml-5>
        <ImageIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Compress Your Images
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>
              Click the &quot;Choose file&quot; button to upload an image.
            </li>
            <li>
              The original image will be displayed along with its size and
              dimensions.
            </li>
            <li>
              Click the Compress &quot;Image&quot; button to start compression.
            </li>
            <li>
              The compressed image will be shown with its new size and
              dimensions.
            </li>
            <li>
              Click the &quot;Download Compressed Image&quot; button to save the
              compressed image.
            </li>
            <li>
              Use the compressed image in your projects, on your website, or
              share it with others.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
