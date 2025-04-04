import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CallBackTutorial from "./UseCallbackTutorial/CallbackTutorial.jsx";
// import { MemoTutorial } from "./MemoTutorial.jsx";
// import ContextTutorial from "./UseContext/ContextTutorial.jsx";
// import { LayoutEffect } from "./useLayoutEffect.jsx";
// import ImperativeHandle from "./UseImperativeHandle/ImperativeHandle.jsx";
// import { RefTutorial } from "./RefTutorial.jsx";

// import EffectTutorial from "./EffectTutorial.jsx";å
// import { StateTutorial } from "./StateTutorial.jsx";
// import { ReducerTutorial } from "./ReducerTutorial.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    {/* <LayoutEffect /> */}
    {/* <ImperativeHandle /> */}
    {/* <RefTutorial /> */}
    {/* <EffectTutorial /> */}
    {/* <ContextTutorial /> */}
    {/* <MemoTutorial /> */}
    <CallBackTutorial />
  </React.StrictMode>
);
