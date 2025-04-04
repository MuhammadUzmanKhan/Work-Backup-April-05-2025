import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
// import App from "./App";
import { ThemeContextProvider } from "./contexts/ThemeContextProvider";
import { RecoilRoot } from "recoil";
import router from "./routes";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <RecoilRoot>
    <React.StrictMode>
      <ThemeContextProvider>
        <RouterProvider router={router} />
      </ThemeContextProvider>
    </React.StrictMode>
  </RecoilRoot>
);
