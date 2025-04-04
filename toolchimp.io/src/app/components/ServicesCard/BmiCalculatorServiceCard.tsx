import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function BMICalculatorServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-centers">
        <ServicesFeatureCard
          icon="📅"
          title="Easy Age Input"
          description="Simply enter your age to get started."
        />
        <ServicesFeatureCard
          icon="👤"
          title="Gender Selection"
          description="Choose your gender to provide accurate calculations."
        />
        <ServicesFeatureCard
          icon="📏"
          title="Height Input"
          description="Enter your height in either centimeters or feet & inches."
        />
        <ServicesFeatureCard
          icon="⚖️"
          title="Weight Input"
          description="Input your weight in kilograms for precise BMI calculation."
        />
        <ServicesFeatureCard
          icon="🔢"
          title="Accurate Calculation"
          description="Get accurate BMI values based on your input data."
        />
        <ServicesFeatureCard
          icon="📊"
          title="Health Risk Assessment"
          description="Understand your health risks based on your BMI category."
        />
      </div>
    </div>
  );
}
