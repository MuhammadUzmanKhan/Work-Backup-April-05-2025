import { useState } from "react";
export const StateTutorial = () => {
  const [inputValue, setinputValue] = useState("");
  return (
    <div>
      <input
        placeholder="Enter something "
        onChange={(event) => {
          setinputValue(event.target.value);
        }}
      />
      {inputValue}
    </div>
  );
};
