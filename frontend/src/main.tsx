import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AdvisorProvider } from '@/context/AdvisorContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdvisorProvider>
        <App />
      </AdvisorProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
