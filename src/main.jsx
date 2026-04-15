import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter basename="/Programacion">
            <AuthProvider>
                <SiteConfigProvider>
                    <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            background: '#fff',
                            color: '#374151',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                            fontSize: '0.875rem',
                        },
                        success: {
                            iconTheme: { primary: '#1A6B4A', secondary: '#fff' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#fff' },
                        },
                    }}
                />
                </SiteConfigProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
