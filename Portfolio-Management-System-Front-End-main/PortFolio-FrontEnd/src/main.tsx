import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
document.body.style.backgroundColor = "black";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
