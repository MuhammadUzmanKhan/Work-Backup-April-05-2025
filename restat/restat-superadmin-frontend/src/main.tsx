import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.scss'
import { Provider } from 'react-redux'
import { store } from './services/redux/store.ts'
import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react'; // Provider imports 'rollbar'


const isLocal = import.meta.env.VITE_APP_ENV === 'local'

const rollbarConfig = {
  enabled: !isLocal,
  captureUncaught: !isLocal,
  captureUnhandledRejections: !isLocal,
  accessToken: isLocal ? undefined : 'bc448818962c449fa4bd99d2e6c5d71f',
  environment: import.meta.env.VITE_APP_ENV ?? 'unset',
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RollbarProvider config={rollbarConfig}>
      <ErrorBoundary>
        <Provider store={store}>
          <App />
        </Provider>
      </ErrorBoundary>
    </RollbarProvider>
  </StrictMode>,
)
