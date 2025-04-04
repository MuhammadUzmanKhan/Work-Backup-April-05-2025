import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function QRCodeGeneratorServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-centers">
        <ServicesFeatureCard
          icon="📝"
          title="Easy Text Input"
          description="Simply enter the text or URL you want to convert into a QR code."
        />
        <ServicesFeatureCard
          icon="⚡"
          title="Instant Generation"
          description="The QR code is generated instantly as you type, providing a seamless experience."
        />
        <ServicesFeatureCard
          icon="📥"
          title="Download QR Code"
          description="Easily download the generated QR code as an image for use in your projects."
        />
        <ServicesFeatureCard
          icon="🆓"
          title="Completely Free"
          description="ToolChimp's QR Code Generator is free to use with no hidden charges or subscriptions."
        />
        <ServicesFeatureCard
          icon="🔒"
          title="Secure and Reliable"
          description="Our QR Code Generator is safe and secure, ensuring your data remains private."
        />
        <ServicesFeatureCard
          icon="🌐"
          title="Accessible Anytime"
          description="Access the QR Code Generator anytime from anywhere without the need for any software installation."
        />
      </div>
    </div>
  );
}
