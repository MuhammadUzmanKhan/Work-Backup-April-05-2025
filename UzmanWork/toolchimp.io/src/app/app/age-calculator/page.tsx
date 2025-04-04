"use client";
import useIsMobile from "@/app/hooks/MobileOnly";
import React, { useState } from "react";

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [calcDate, setCalcDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [ageDetails, setAgeDetails] = useState<string>("");
  const [error, setError] = useState<string>("");
  const isMobile = useIsMobile();
  const calculateAgeAndDay = () => {
    if (!birthDate || !calcDate) {
      setError("Please select both dates.");
      return;
    }

    const birth = new Date(birthDate);
    const calc = new Date(calcDate);

    if (birth > calc) {
      setError("The birth date must be less than the calculation date.");
      setAgeDetails("");
      return;
    }

    setError("");

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
      (calc.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
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
        `or ${totalSeconds} seconds`
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-start pt-5 min-h-screen gap-3"
      style={{ backgroundColor: "#212121" }}
    >
      <div
        className={`bg-white p-8 rounded-lg shadow-md ${
          isMobile ? "w-11/12" : "w-full"
        } max-w-md`}
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-5">
          Age Calculator
        </h2>
        <div className="mb-4">
          <label
            htmlFor="birthDate"
            className="block text-gray-700 font-semibold mb-2"
          >
            Date of Birth:
          </label>
          <input
            type="date"
            id="birthDate"
            className="w-full p-2 border rounded-lg"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="calcDate"
            className="block text-gray-700 font-semibold mb-2"
          >
            Age at the Date of:
          </label>
          <input
            type="date"
            id="calcDate"
            className="w-full p-2 border rounded-lg"
            value={calcDate}
            onChange={(e) => setCalcDate(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={calculateAgeAndDay}
          className="w-full py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          Calculate
        </button>
        {ageDetails && (
          <div className="mt-5 whitespace-pre-line">
            <p className="text-gray-700 font-semibold">{ageDetails}</p>
          </div>
        )}
      </div>
    </div>
  );
}
