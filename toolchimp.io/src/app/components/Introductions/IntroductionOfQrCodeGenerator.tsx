import QRCodeIcon from "@/icons/qr-code-icon";

export default function IntroductionOfQRCodeGenerator() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div ml-5>
        <QRCodeIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Generate QR Codes
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>Enter the text or URL you want to convert into a QR code.</li>
            <li>The QR code will be generated automatically as you type.</li>
            <li>
              Once generated, you can see the QR code displayed on the screen.
            </li>
            <li>
              Click the &quot;Download QR Code&quot; button to save the QR code
              as an image.
            </li>
            <li>
              You will see a notification of success after the download is
              complete.
            </li>
            <li>
              Use the downloaded QR code in your projects, on your website, or
              share it with others.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
