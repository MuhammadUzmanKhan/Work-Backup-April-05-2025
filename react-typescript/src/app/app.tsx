import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const App: React.FC<{ compiler: string, framework: string }> = (props) => {

  const [inputState, setInputState] = useState({
    input1: "",
    input2: ""
  });

  const Sum = ($add1: number, $add2: number) => {
    return $add1 + $add2;
  }

  return (
    <div>
      <div>{}-{props.compiler}</div>
      <br />
      Input 1: <input type="text" onChange={(e) => setInputState({
        ...inputState,
        input1: e.target.value
      })} />{" "}
      Input 2: <input type="text" onChange={(e) => setInputState({
        ...inputState,
        input2: e.target.value
      })} />
      <br />
      <br />
      Sum : {Sum(+inputState.input1, +inputState.input2)}
    </div>
  );
}

ReactDOM.render(
  <App compiler="TypeScript" framework="React" />,
  document.getElementById("root")
);