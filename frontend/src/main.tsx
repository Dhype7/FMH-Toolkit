import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111827',
            color: '#e2e8f0',
            border: '1px solid #1e3a5f',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.85rem',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#111827' },
          },
          error: {
            iconTheme: { primary: '#ff3366', secondary: '#111827' },
          },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
