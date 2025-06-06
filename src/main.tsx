import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import StripeProvider from './components/StripeProvider';


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StripeProvider>
      <App />
      <Toaster />
    </StripeProvider>
  </React.StrictMode>
);
