import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Vercel Analytics — visitor tracking in Vercel dashboard
inject()

// Vercel Speed Insights — Core Web Vitals (LCP, CLS, FID)
injectSpeedInsights()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
