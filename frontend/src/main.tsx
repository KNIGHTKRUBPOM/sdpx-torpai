import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RouterApp from './RouterApp.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><RouterApp /></AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
