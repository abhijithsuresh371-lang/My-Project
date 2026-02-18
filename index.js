import React from 'react';
import ReactDOM from 'react-dom/client'; // ⚠️ Must use /client in React 18
import './index.css';
import App from './App';

// ⚠️ The new way to start React 18 apps
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);