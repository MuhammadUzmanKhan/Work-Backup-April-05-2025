import BMIIcon from "@/icons/bmi-calculator-icon";

export default function IntroductionOfBMICalculator() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div className="ml-5">
        <BMIIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            BMI Calculator
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>Enter your age in the provided input field.</li>
            <li>Select your gender by clicking on the appropriate option.</li>
            <li>
              Choose your preferred unit for height measurement (cm or feet &
              inches).
            </li>
            <li>Enter your height based on the selected unit.</li>
            <li>Enter your weight in kilograms.</li>
            <li>
              Click the &quot;Calculate&quot; button to determine your BMI.
            </li>
            <li>
              Your BMI value and its category will be displayed below the
              button.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
