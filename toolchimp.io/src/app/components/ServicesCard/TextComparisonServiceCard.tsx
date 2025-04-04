import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function TextComparisonServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
        <ServicesFeatureCard
          icon="📝"
          title="Simple Text Input"
          description="Enter or paste the texts you want to compare in the provided fields."
        />
        <ServicesFeatureCard
          icon="🔍"
          title="Detailed Comparison"
          description="Get a detailed comparison highlighting the differences between the texts."
        />
        <ServicesFeatureCard
          icon="⚡"
          title="Quick Analysis"
          description="Instantly compare texts and get the results within seconds."
        />
        <ServicesFeatureCard
          icon="🔄"
          title="Swap Texts"
          description="Easily swap the texts between the left and right fields for a reverse comparison."
        />
        <ServicesFeatureCard
          icon="🆓"
          title="Free to Use"
          description="ToolChimp's Text Comparison tool is completely free to use without any charges."
        />
        <ServicesFeatureCard
          icon="🌐"
          title="Accessible Anywhere"
          description="Use the Text Comparison tool from any device, anywhere, without installing any software."
        />
      </div>
    </div>
  );
}
