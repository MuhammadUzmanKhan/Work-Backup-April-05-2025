import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function SpinnerServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-centers">
        <ServicesFeatureCard
          icon="🎉"
          title="Fun and Engaging"
          description="Create a fun and engaging experience for your events with our interactive spinner."
        />
        <ServicesFeatureCard
          icon="⚙️"
          title="Customizable Options"
          description="Easily customize the spinner with your own entries and colors to suit your needs."
        />
        <ServicesFeatureCard
          icon="🔊"
          title="Sound Effects"
          description="Enhance the excitement with built-in sound effects during the spin."
        />
        <ServicesFeatureCard
          icon="💻"
          title="Web-Based"
          description="Our spinner is entirely web-based, requiring no downloads or installations."
        />
        <ServicesFeatureCard
          icon="🔍"
          title="Real-Time Results"
          description="Get real-time results with our spinner, perfect for raffles, giveaways, and more."
        />
        <ServicesFeatureCard
          icon="📱"
          title="Mobile Friendly"
          description="Access and use the spinner from any device, including mobile phones and tablets."
        />
      </div>
    </div>
  );
}
