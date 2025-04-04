"use client";
import React, { useState } from "react";
import useIsMobile from "@/app/hooks/MobileOnly";
import WorkingOfBMICalculator from "@/app/components/Working/WorkingOfBmiCalculator";

import BMICalculatorServiceCard from "@/app/components/ServicesCard/BmiCalculatorServiceCard";
import FAQBMICalculator from "@/app/components/Faqs/FaqBmiCalculator";
import HistoryOfBMICalculator from "@/app/components/Histories/HistoryOfBmiCalculator";
import IntroductionOfBMICalculator from "@/app/components/Introductions/IntroductionOfBmiCalculator";

export default function BMICalculator() {
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [heightCm, setHeightCm] = useState<string>("");
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "feet-inches">(
    "feet-inches",
  );
  const [weight, setWeight] = useState<string>("");
  const [bmi, setBMI] = useState<string | null>(null);
  const [bmiCategory, setBMICategory] = useState<string>("");
  const [healthRisk, setHealthRisk] = useState<string>("");
  const [error, setError] = useState<string>("");
  const isMobile = useIsMobile();

  function calculateBMI() {
    if (
      !age ||
      !weight ||
      (heightUnit === "cm" && !heightCm) ||
      (heightUnit === "feet-inches" && (!heightFeet || !heightInches))
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    let heightInMeters;

    if (ageNum < 2 || ageNum > 120) {
      setError("Age must be between 2 and 120.");
      return;
    }

    if (heightUnit === "cm") {
      heightInMeters = parseFloat(heightCm) / 100;
    } else {
      const heightFeetNum = parseFloat(heightFeet);
      const heightInchesNum = parseFloat(heightInches);
      heightInMeters = (heightFeetNum * 12 + heightInchesNum) * 0.0254;
    }

    const calculatedBMI = (
      weightNum /
      (heightInMeters * heightInMeters)
    ).toFixed(2);

    setBMI(calculatedBMI);
    setError("");

    // Determine BMI category and health risks
    const bmiValue = parseFloat(calculatedBMI);

    let category = "";
    let risk = "";

    switch (true) {
      case bmiValue < 18.5:
        category = "Underweight";
        risk = "Risk of nutritional deficiency and osteoporosis.";
        break;
      case bmiValue >= 18.5 && bmiValue < 24.9:
        category = "Normal weight";
        risk = "Low risk (healthy range).";
        break;
      case bmiValue >= 25 && bmiValue < 29.9:
        category = "Overweight";
        risk =
          "Moderate risk of developing heart disease, high blood pressure, stroke, diabetes.";
        break;
      case bmiValue >= 30 && bmiValue < 34.9:
        category = "Obesity (Class I)";
        risk =
          "High risk of developing heart disease, high blood pressure, stroke, diabetes.";
        break;
      case bmiValue >= 35 && bmiValue < 39.9:
        category = "Obesity (Class II)";
        risk =
          "Very high risk of developing heart disease, high blood pressure, stroke, diabetes.";
        break;
      default:
        category = "Obesity (Class III)";
        risk =
          "Extremely high risk of developing heart disease, high blood pressure, stroke, diabetes.";
        break;
    }

    setBMICategory(category);
    setHealthRisk(risk);
  }

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3 "
      style={{ backgroundColor: "#212121" }}
    >
      <div
        className={`p-8 rounded-lg shadow-md ${
          isMobile ? "w-11/12" : "w-full"
        } max-w-md`}
      >
        <h1 className="text-2xl md:text-4xl text-center font-extrabold mb-5 page-title">
          BMI Calculator
        </h1>
        <div className="mb-4">
          <label htmlFor="age" className="block text-white font-semibold mb-2 ">
            Age:
          </label>
          <input
            type="number"
            id="age"
            className="w-full p-2 border rounded-lg bg-gray-800 border-gray-600 text-white"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="2"
            max="120"
          />
        </div>
        <div className="mb-4">
          <label className="block text-white text-gray-700 font-semibold mb-2 ">
            Gender:
          </label>
          <div>
            <label className="mr-4  text-white flex items-center">
              <input
                type="radio"
                value="male"
                checked={gender === "male"}
                onChange={(e) => setGender(e.target.value as "male")}
                className="mr-2"
              />
              Male
            </label>
            <label className="flex  text-white items-center">
              <input
                type="radio"
                value="female"
                checked={gender === "female"}
                onChange={(e) => setGender(e.target.value as "female")}
                className="mr-2"
              />
              Female
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2 text-white">
            Height:
          </label>
          <div className="flex items-center mb-2 text-white">
            <label className="mr-4 flex items-center">
              <input
                type="radio"
                value="cm"
                checked={heightUnit === "cm"}
                onChange={(e) => setHeightUnit(e.target.value as "cm")}
                className="mr-2"
              />
              Cm
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="feet-inches"
                checked={heightUnit === "feet-inches"}
                onChange={(e) => setHeightUnit(e.target.value as "feet-inches")}
                className="mr-2"
              />
              Feet & Inches
            </label>
          </div>
          {heightUnit === "cm" ? (
            <input
              type="number"
              id="height"
              className="w-full p-2 border rounded-lg bg-gray-800 border-gray-600 text-white"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                id="heightFeet"
                className="w-1/2 p-2 border rounded-lg bg-gray-800 border-gray-600 text-white"
                placeholder="Feet"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
              />
              <input
                type="number"
                id="heightInches"
                className="w-1/2 p-2 border rounded-lg bg-gray-800 border-gray-600 text-white"
                placeholder="Inches"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="mb-4 ">
          <label
            htmlFor="weight"
            className="block text-gray-700 font-semibold mb-2 text-white "
          >
            Weight (kg):
          </label>
          <input
            type="number"
            id="weight"
            className="w-full p-2 border rounded-lg bg-gray-800 border-gray-600 text-white"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={calculateBMI}
          className="w-full py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          Calculate
        </button>
        {bmi && (
          <div className="mt-5">
            <p className="text-gray-700 font-semibold text-white">
              Your BMI is {bmi} ({bmiCategory})
            </p>
            <p className="text-gray-500 text-white">{healthRisk}</p>
          </div>
        )}
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl`}
      >
        <WorkingOfBMICalculator />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl mt-10">
        <IntroductionOfBMICalculator />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl mt-10">
        <BMICalculatorServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl mt-10`}
      >
        <HistoryOfBMICalculator />
      </div>
      <FAQBMICalculator />
    </div>
  );
}
