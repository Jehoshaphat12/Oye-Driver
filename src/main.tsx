import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dismiss the HTML splash once React has painted its first frame
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    (window as any).__hideSplash?.();
  });
});
