import React from 'react'
import ReactDOM from 'react-dom/client'
import { Dashboard } from './components/Dashboard'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <Dashboard />
    </React.StrictMode>,
)
