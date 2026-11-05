import './App.css'
import './service/ServiceReport.css'
import { useCallback, useState } from 'react'
import { BoxDesigner } from './tabs/BoxDesigner'
import { ServiceReport } from './tabs/ServiceReport'
import { ChargerReport } from './tabs/ChargerReport'
import { ToastContainer } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'

const TABS = [
  {
    id: 'designer', label: 'Battery Box Layout Designer', short: 'Box Designer', icon: '📦',
    desc: 'Enter box dimensions and cell layout, see the 3D box and export a spec sheet PDF.',
    Component: BoxDesigner,
  },
  {
    id: 'battery', label: 'Battery Service Report', short: 'Battery Report', icon: '🔋',
    desc: 'Cell SG and voltage readings, dead cells, photos and verified PDF report.',
    Component: ServiceReport,
  },
  {
    id: 'charger', label: 'Charger Service Report', short: 'Charger Report', icon: '🔌',
    desc: 'Charger details, customer fault, assessment, replacement recommendation and photos.',
    Component: ChargerReport,
  },
]

function TabError() {
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <strong>Something went wrong in this tab.</strong>
      <div className="hint">Reload the page to try again. The other tabs still work.</div>
    </div>
  )
}

function App() {
  const [tab, setTab] = useState(null) // nothing open after login
  const [opened, setOpened] = useState({}) // tabs mounted once visited, so switching keeps work
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
    if (id) setOpened(o => ({ ...o, [id]: true }))
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="page">
      <header className="topbar">
        <button type="button" className="brand brandHome" onClick={() => selectTab(null)} title="Home">
          <img className="brandLogo" src="/logo.svg" alt="Direct Energy logo" />
          <div>
            <div className="brandTitle">Direct Energy Battery Tools</div>
            <div className="brandSub">Box designer · Battery &amp; charger service reports</div>
          </div>
        </button>
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

      {tab === null && (
        <section className="homeGrid">
          {TABS.map(t => (
            <button key={t.id} type="button" className="homeCard" onClick={() => selectTab(t.id)}>
              <span className="homeIcon" aria-hidden="true">{t.icon}</span>
              <span className="homeTitle">{t.label}</span>
              <span className="homeDesc">{t.desc}</span>
              <span className="homeGo">Open →</span>
            </button>
          ))}
        </section>
      )}

      {TABS.map(t => opened[t.id] && (
        <div key={t.id} hidden={tab !== t.id} className="tabPane">
          <ErrorBoundary fallback={<TabError />}><t.Component addToast={addToast} /></ErrorBoundary>
        </div>
      ))}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
