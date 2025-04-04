// import { useState } from "react";
// implemented useReducer functionality with useState
// export function ReducerTutorial() {
//   const [count, setCount] = useState(0);
//   const [showText, setShowText] = useState(true);
//   return (
//     <div>
//       <h1>{count}</h1>
//       <button
//         onClick={() => {
//           setCount(count + 1), setShowText(!showText);
//         }}
//       >
//         Click here
//       </button>
//       {showText && <p>This is a text</p>};
//     </div>
//   );
// }

import { useReducer } from "react";
const reducer = (state, action) => {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1, showText: state.showText };
    case "toggleShowText":
      return { count: state.count + 1, showText: !state.showText };
    default:
      return state;
  }
};
export function ReducerTutorial() {
  const [state, dispatch] = useReducer(reducer, { count: 0, showText: true });
  return (
    <div>
      <h1>{state.count}</h1>
      <buttons
        onClick={() => {
          dispatch({ type: "INCREMENT" });
          dispatch({ type: "toggleShowText" });
        }}
      >
        Click here
      </buttons>
      {state.showText && <p>This is a text</p>};
    </div>
  );
}
