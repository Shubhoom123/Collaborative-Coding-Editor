import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const resizeObserverError = window.onerror;
window.onerror = (message, ...args) => {
  if (message?.includes('ResizeObserver loop')) return true;
  return resizeObserverError?.(message, ...args);
};
 
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
 
reportWebVitals();