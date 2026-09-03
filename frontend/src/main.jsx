import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.VITE_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Clerk publishable key is missing. Add VITE_CLERK_PUBLISHABLE_KEY to your .env file.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={clerkPubKey}>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);