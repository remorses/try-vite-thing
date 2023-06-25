import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import React from 'react'
console.log('hydrating', React)

ReactDOM.hydrateRoot(
    document.getElementById('app'),
    <BrowserRouter>
        <App />
    </BrowserRouter>,
)
console.log('hydrated')
