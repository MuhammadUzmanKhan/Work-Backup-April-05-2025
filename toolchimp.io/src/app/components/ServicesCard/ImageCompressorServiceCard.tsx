import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function ImageCompressorServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
        <ServicesFeatureCard
          icon="🖼️"
          title="Simple File Upload"
          description="Easily upload your image file to be compressed."
        />
        <ServicesFeatureCard
          icon="⚡"
          title="Quick Compression"
          description="Compress your images quickly without any hassle."
        />
        <ServicesFeatureCard
          icon="📥"
          title="Download Compressed Image"
          description="Download the compressed image for use in your projects."
        />
        <ServicesFeatureCard
          icon="🆓"
          title="Completely Free"
          description="ToolChimp's Image Compressor is free to use with no hidden charges or subscriptions."
        />
        <ServicesFeatureCard
          icon="🔒"
          title="Secure and Reliable"
          description="Our Image Compressor ensures your data remains private and secure."
        />
        <ServicesFeatureCard
          icon="🌐"
          title="Accessible Anytime"
          description="Access the Image Compressor anytime from anywhere without the need for any software installation."
        />
      </div>
    </div>
  );
}
