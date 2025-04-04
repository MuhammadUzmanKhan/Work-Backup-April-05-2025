import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function AgeCalculatorServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-centers">
        <ServicesFeatureCard
          icon="📅"
          title="Easy Date Input"
          description="Simply enter your date of birth and the date for which you want to calculate your age."
        />
        <ServicesFeatureCard
          icon="⚙️"
          title="Accurate Calculation"
          description="Get precise age calculations in years, months, and days."
        />
        <ServicesFeatureCard
          icon="📊"
          title="Detailed Information"
          description="View your age in various formats including weeks, days, hours, minutes, and seconds."
        />
        <ServicesFeatureCard
          icon="🗓️"
          title="Day of the Week"
          description="Find out the day of the week you were born on."
        />
        <ServicesFeatureCard
          icon="📱"
          title="Responsive Design"
          description="Use the age calculator on any device, be it mobile or desktop."
        />
        <ServicesFeatureCard
          icon="💡"
          title="User-Friendly Interface"
          description="Enjoy a simple and intuitive interface that makes age calculation easy."
        />
      </div>
    </div>
  );
}
