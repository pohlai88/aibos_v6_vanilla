import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/globals.css'

console.log('main.tsx: Starting app initialization')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/aibos_v6_vanilla">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

console.log('main.tsx: App rendered to DOM') 