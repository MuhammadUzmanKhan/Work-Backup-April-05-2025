import { useRef } from "react";

export function RefTutorial() {
  const inputRef = useRef(null);
  const onClick = () => {
    // console.log(inputRef.current.value);
    // inputRef.current.focus();
    inputRef.current.focus();
  };

  return (
    <div>
      RefTutorial
      <h1>Predo</h1>
      <input type="text" placeholder="Ex..." ref={inputRef} />
      <button onClick={onClick}>Change Name</button>
    </div>
  );
}
