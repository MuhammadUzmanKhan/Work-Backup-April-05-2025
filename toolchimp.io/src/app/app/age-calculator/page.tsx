"use client";
import FAQAgeCalculator from "@/app/components/Faqs/FaqAgeCalculator";
import HistoryOfAgeCalculator from "@/app/components/Histories/HistoryOfAgeCalculator";
import IntroductionOfAgeCalculator from "@/app/components/Introductions/IntroductionOfAgeCalculator";
import AgeCalculatorServiceCard from "@/app/components/ServicesCard/AgeCalculatorServiceCard";
import WorkingOfAgeCalculator from "@/app/components/Working/WorkingOfAgeCalculator";
import useIsMobile from "@/app/hooks/MobileOnly";
import React, { useState } from "react";

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [calcDate, setCalcDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [ageDetails, setAgeDetails] = useState<string>("");
  const [errorBirthDate, setErrorBirthDate] = useState<string>("");
  const [errorCalcDate, setErrorCalcDate] = useState<string>("");
  const isMobile = useIsMobile();

  const calculateAgeAndDay = () => {
    if (!birthDate) {
      setErrorBirthDate("Please select Date of Birth.");
      return;
    } else {
      setErrorBirthDate("");
    }

    if (!calcDate) {
      setErrorCalcDate("Please select Age at the Date of.");
      return;
    } else {
      setErrorCalcDate("");
    }

    const birth = new Date(birthDate);
    const calc = new Date(calcDate);

    if (birth > calc) {
      setErrorCalcDate(
        "The birth date must be less than the calculation date.",
      );
      setAgeDetails("");
      return;
    }

    // Clear all errors if everything is valid
    setErrorBirthDate("");
    setErrorCalcDate("");

    // Calculating age
    let ageYears = calc.getFullYear() - birth.getFullYear();
    let ageMonths = calc.getMonth() - birth.getMonth();
    let ageDays = calc.getDate() - birth.getDate();

    if (ageDays < 0) {
      ageMonths--;
      ageDays += new Date(calc.getFullYear(), calc.getMonth(), 0).getDate();
    }

    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    // Calculating total months, weeks, days, hours, minutes, and seconds
    const totalMonths = ageYears * 12 + ageMonths;
    const totalDays = Math.floor(
      (calc.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    const remainingDaysInWeek = totalDays % 7;

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const birthDay = daysOfWeek[birth.getDay()];

    setAgeDetails(
      `Birthday:\n` +
        `You were born on a ${birthDay}.\n` +
        `Age:\n` +
        `${ageYears} years ${ageMonths} months ${ageDays} days\n` +
        `or ${totalMonths} months ${ageDays} days\n` +
        `or ${totalWeeks} weeks ${remainingDaysInWeek} days\n` +
        `or ${totalDays} days\n` +
        `or ${totalHours} hours\n` +
        `or ${totalMinutes} minutes\n` +
        `or ${totalSeconds} seconds`,
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
      style={{ backgroundColor: "#212121" }}
    >
      <div
        className={`p-2 rounded-lg shadow-md ${
          isMobile ? "w-11/12" : "w-full"
        } max-w-md text-white`}
      >
        <h1 className="text-2xl md:text-4xl text-center font-extrabold mb-5 page-title shadow-2xl">
          Age Calculator
        </h1>
        <div className="mb-4">
          <label htmlFor="birthDate" className="block font-semibold mb-2">
            Date of Birth:
          </label>
          <input
            type="date"
            id="birthDate"
            className="w-full p-2 border rounded-lg bg-gray-800 text-white custom-date-input"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <style jsx>{`
            /* This styles the calendar icon */
            input[type="date"]::-webkit-calendar-picker-indicator {
              filter: invert(1); /* Inverts colors (white to black) */
            }
          `}</style>
          {errorBirthDate && (
            <p className="text-red-500 mt-1">{errorBirthDate}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="calcDate" className="block font-semibold mb-2">
            Age at the Date of:
          </label>
          <input
            type="date"
            id="calcDate"
            className="w-full p-2 border rounded-lg bg-gray-800 text-white custom-date-input"
            value={calcDate}
            onChange={(e) => setCalcDate(e.target.value)}
          />
          <style jsx>{`
            input[type="date"]::-webkit-calendar-picker-indicator {
              filter: invert(1);
            }
          `}</style>
          {errorCalcDate && (
            <p className="text-red-500 mt-1">{errorCalcDate}</p>
          )}
        </div>
        <button
          onClick={calculateAgeAndDay}
          className="w-full py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          Calculate
        </button>
        {ageDetails && (
          <div className="mt-5 whitespace-pre-line">
            <p className="font-semibold">{ageDetails}</p>
          </div>
        )}
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl`}
      >
        <WorkingOfAgeCalculator />
      </div>
      <div className="flex flex-col justify-start items-center pt-5 bg-[#212121] text-white shadow-2xl mt-10">
        <IntroductionOfAgeCalculator />
      </div>
      <div className="flex flex-col items-center p-2 shadow-2xl mt-10 text-white">
        <AgeCalculatorServiceCard />
      </div>
      <div
        className={`flex flex-col items-center justify-center ${isMobile ? "px-5" : "px-64"} text-white bg-[#212121] rounded-lg p-6 shadow-2xl mt-10`}
      >
        <HistoryOfAgeCalculator />
      </div>
      <FAQAgeCalculator />
    </div>
  );
}
