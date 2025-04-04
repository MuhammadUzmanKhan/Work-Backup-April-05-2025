import React, { useState } from "react";
import { Typography } from "@mui/material";

function calculateSundays(startDate, endDate) {
  let totalSundays = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() === 0) {
      totalSundays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalSundays;
}

export function Sundays() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState("");

  const handleStartDateChange = (event) => {
    const date = new Date(event.target.value);
    if (date && date.getDate() >= 28) {
      setError("Start date must be before the 28th of the month.");
      return;
    }
    setError("");
    setStartDate(date);
  };

  const handleEndDateChange = (event) => {
    const date = new Date(event.target.value);
    if (date && date.getDate() >= 28) {
      setError("End date must be before the 28th of the month.");
      return;
    }
    setError("");
    setEndDate(date);
  };

  return (
    <div>
      <div>
        <input
          type="date"
          placeholder="Start Date"
          value={startDate ? startDate.toISOString().split("T")[0] : ""}
          onChange={handleStartDateChange}
        />
      </div>
      <div>
        <input
          type="date"
          placeholder="End Date"
          value={endDate ? endDate.toISOString().split("T")[0] : ""}
          onChange={handleEndDateChange}
        />
      </div>
      {error && <Typography color="error">{error}</Typography>}
      {startDate && endDate && startDate < endDate && (
        <Typography variant="h6">
          Number of Sundays between the selected dates:{" "}
          {calculateSundays(startDate, endDate)}
        </Typography>
      )}
    </div>
  );
}
