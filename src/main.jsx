import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

// Native app initialization (Capacitor)
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setBackgroundColor({ color: '#07080f' });
    StatusBar.setStyle({ style: Style.Dark });
  }).catch(() => {});

  import('@capacitor/splash-screen').then(({ SplashScreen }) => {
    SplashScreen.hide();
  }).catch(() => {});
} else {
  // Register service worker for PWA (only when running in browser)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
