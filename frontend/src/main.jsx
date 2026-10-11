import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import UEffect from './UEffect.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UEffect />
  </StrictMode>,
)
