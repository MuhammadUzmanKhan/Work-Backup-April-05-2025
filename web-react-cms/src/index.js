import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './localization/index';
import './index.css';
import App from './App';
import { store } from './store/store';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
serviceWorker.register();
