import './App.css'
import './service/ServiceReport.css'
import { useCallback, useState } from 'react'
import { BoxDesigner } from './tabs/BoxDesigner'
import { ServiceReport } from './tabs/ServiceReport'
import { ToastContainer } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'

function TabError() {
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <strong>Something went wrong in this tab.</strong>
      <div className="hint">Reload the page to try again. The other tab still works.</div>
    </div>
  )
}

const TABS = [
  { id: 'designer', label: 'Battery Box Layout Designer', short: 'Box Designer' },
  { id: 'service',  label: 'Battery Service Report',      short: 'Service Report' },
]

const TAB_KEY = 'de_active_tab_v1'

function readTab() {
  try {
    const t = localStorage.getItem(TAB_KEY)
    return TABS.some(x => x.id === t) ? t : 'designer'
  } catch {
    return 'designer'
  }
}

function App() {
  const [tab, setTab] = useState(readTab)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const selectTab = (id) => {
    setTab(id)
    try { localStorage.setItem(TAB_KEY, id) } catch { /* ignore */ }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <img className="brandLogo" src="/logo.svg" alt="Direct Energy logo" />
          <div>
            <div className="brandTitle">Direct Energy Battery Tools</div>
            <div className="brandSub">Box layout designer and battery service reports</div>
          </div>
        </div>
        <nav className="appTabs" role="tablist" aria-label="Tools">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`appTab${tab === t.id ? ' active' : ''}`}
              onClick={() => selectTab(t.id)}
            >
              <span className="appTabLong">{t.label}</span>
              <span className="appTabShort">{t.short}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Both tabs stay mounted so switching never loses work in progress */}
      <div hidden={tab !== 'designer'} className="tabPane">
        <ErrorBoundary fallback={<TabError />}><BoxDesigner addToast={addToast} /></ErrorBoundary>
      </div>
      <div hidden={tab !== 'service'} className="tabPane">
        <ErrorBoundary fallback={<TabError />}><ServiceReport addToast={addToast} /></ErrorBoundary>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
