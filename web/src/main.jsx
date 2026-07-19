import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AppToaster from './components/AppToaster';
import { store } from './app/store';
import './index.css';
import { LanguageProvider } from './i18n/LanguageProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <LanguageProvider>
        <BrowserRouter>
          <App />
          <AppToaster />
        </BrowserRouter>
      </LanguageProvider>
    </Provider>
  </React.StrictMode>
);
