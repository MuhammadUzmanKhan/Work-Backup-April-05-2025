import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import { store } from "./services/redux/store";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import TagManager from 'react-gtm-module'
import addGoogleTagManager from "./services/constants/gtm";
import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react'; // Provider imports 'rollbar'


const gtmID = process.env.REACT_APP_GTM_ID
const isLocal = process.env.REACT_APP_ENV === 'local'

if (process.env.REACT_APP_ENV === 'prod' && gtmID) {
  addGoogleTagManager(gtmID);
  const tagManagerArgs = {
    gtmId: gtmID
  }

  window.dataLayer.push({
    event: 'pageview'
  });

  TagManager.initialize(tagManagerArgs)
}

const rollbarConfig = {
  enabled: !isLocal,
  accessToken: isLocal ? undefined : 'bc448818962c449fa4bd99d2e6c5d71f',
  environment: process.env.REACT_APP_ENV ?? 'unset',
  captureUncaught: !isLocal, // Only capture errors if enabled
  captureUnhandledRejections: !isLocal,
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <RollbarProvider config={rollbarConfig}>
      <ErrorBoundary>
        <Provider store={store}>
          <App />
        </Provider>
      </ErrorBoundary>
    </RollbarProvider>
  </React.StrictMode>
);

reportWebVitals();
