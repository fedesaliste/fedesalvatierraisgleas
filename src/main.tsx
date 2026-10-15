import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { iniciarFavicon } from './lib/favicon'
import { visitas } from './lib/visitas'

iniciarFavicon()
// se cuenta al llegar, no al llegar a la bio
visitas()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
