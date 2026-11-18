import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from '@/App.tsx'
import '@/index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Notes pages and the 404 page ship pre-rendered HTML: hydrate it so content shows instantly and
// stays put. The homepage is client-rendered.
if (rootElement.hasChildNodes()) hydrateRoot(rootElement, app)
else createRoot(rootElement).render(app)
