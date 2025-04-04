import { useEffect, useLayoutEffect, useRef } from "react";
export function LayoutEffect() {
  const inputRef = useRef(null);
  useLayoutEffect(() => {
    console.log("Use layout effect");
    console.log(inputRef.current.value);
  }, []);
  useEffect(() => {
    inputRef.current.value = "Hello";
    console.log("Use  effect");
  }, []);

  return (
    <div>
      <input
        type="text"
        ref={inputRef}
        value="PEDRO"
        style={{ width: "400", height: "200" }}
      />
      useLayoutEffect
    </div>
  );
}
